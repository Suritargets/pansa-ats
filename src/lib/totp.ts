import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { authSecret } from "./auth-secret";

/**
 * Time-based one-time passwords (RFC 6238 over HOTP, RFC 4226): the second factor of the sign-in. Pure (node:crypto only, no
 * database, no request), so the unit tests and the end-to-end tests compute the same codes as an authenticator app would.
 *
 * A secret is 20 random bytes, shown to the person once as Base32 (the format every authenticator app accepts) and stored
 * encrypted (lib/totp-crypto.ts). A code is 6 digits that change every 30 seconds; the step before and after the current one
 * are accepted too (clock drift), and the step that was accepted is kept so the same code is never accepted twice.
 */
export const TOTP_PERIOD = 30;
export const TOTP_DIGITS = 6;
/** The accepted code of a step before or after the current one, to allow for clocks that are a little off. */
export const TOTP_WINDOW = 1;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 Base32 without padding (the authenticator apps strip the padding themselves). */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** Decodes Base32 as people type or paste it: any case, spaces and dashes ignored, padding optional. Throws on other characters. */
export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const index = BASE32_ALPHABET.indexOf(ch);
    if (index < 0) throw new Error("Invalid Base32 character");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new authenticator secret: 20 random bytes as Base32 (32 characters). */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The 30-second step of a moment (milliseconds since the epoch). */
export function totpStep(now = Date.now()): number {
  return Math.floor(now / 1000 / TOTP_PERIOD);
}

/** HOTP (RFC 4226): HMAC-SHA1 of the 8-byte big-endian counter, dynamic truncation, the last `TOTP_DIGITS` digits. */
function hotp(key: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  // Two 32-bit halves: a step number is far beyond 2^32 before the year 6000, but JavaScript bit operators are 32-bit.
  message.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  message.writeUInt32BE(counter % 0x100000000, 4);
  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

/** The code of a Base32 secret for one time step. */
export function totpCode(secret: string, step: number): string {
  return hotp(base32Decode(secret), step);
}

/** True for exactly six digits (what the form accepts before anything is computed). */
export function isPlausibleTotpCode(code: string): boolean {
  return new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(code);
}

/**
 * Checks a code against the secret for the current step and `window` steps around it. Returns the step that matched (store it
 * as the last accepted step and refuse anything at or below it, so a code cannot be replayed), or null.
 * The comparison is constant-time per candidate.
 */
export function verifyTotp(secret: string, code: string, now = Date.now(), opts: { window?: number } = {}): { step: number } | null {
  if (!isPlausibleTotpCode(code)) return null;
  const window = opts.window ?? TOTP_WINDOW;
  const key = base32Decode(secret);
  const current = totpStep(now);
  const given = Buffer.from(code);
  let matched: number | null = null;
  for (let step = current - window; step <= current + window; step++) {
    if (step < 0) continue;
    const expected = Buffer.from(hotp(key, step));
    if (expected.length === given.length && timingSafeEqual(expected, given)) matched = step;
  }
  return matched === null ? null : { step: matched };
}

/** The `otpauth://` address an authenticator app reads from the QR code (issuer and account are escaped). */
export function otpauthUri({ issuer, account, secret }: { issuer: string; account: string; secret: string }): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/** Lowercase letters and digits that cannot be mistaken for each other on paper (no i, l, o, 0, 1). */
const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const RECOVERY_CODE_COUNT = 8;
export const RECOVERY_CODE_RE = /^[a-z0-9]{4}-[a-z0-9]{4}$/;

/** New recovery codes in the form `xxxx-xxxx`; each is shown once and stored as a hash. */
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    let raw = "";
    for (let i = 0; i < 8; i++) raw += RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)];
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return [...codes];
}

/** A recovery code as the person typed it: case and spaces do not matter, the dash may be left out. */
export function normalizeRecoveryCode(input: string): string {
  const raw = input.toLowerCase().replace(/[\s-]/g, "");
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : input.trim().toLowerCase();
}

/**
 * How a recovery code is stored: HMAC-SHA-256 keyed from `AUTH_SECRET` (with a context label), hex. A code has only about 40 bits, so a
 * bare hash of it could be brute-forced offline from a copy of the database; the key stays out of the database. Changing AUTH_SECRET
 * makes codes stored this way stop matching (like the authenticator secrets, see lib/totp-crypto.ts): make new ones afterwards.
 */
export function hashRecoveryCode(code: string): string {
  return createHmac("sha256", authSecret()).update(`recovery-code:${normalizeRecoveryCode(code)}`).digest("hex");
}

/** True when `stored` is the hash of `code`, compared in constant time. */
export function recoveryCodeMatches(stored: string, code: string): boolean {
  const storedBytes = Buffer.from(stored);
  const given = Buffer.from(hashRecoveryCode(code));
  return storedBytes.length === given.length && timingSafeEqual(storedBytes, given);
}
