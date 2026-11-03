import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { authSecret } from "./auth-secret";

/**
 * Authenticator secrets at rest: AES-256-GCM with a key derived from the existing `AUTH_SECRET` through HKDF (info "totp-secret"),
 * so no second environment variable is needed and a database copy alone never reveals a secret. The stored form is
 * `v1.<iv>.<ciphertext>.<tag>` in base64url; a changed byte anywhere fails the authentication tag and decrypts to null.
 */
const INFO = "totp-secret";
const VERSION = "v1";

function deriveKey(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "", INFO, 32));
}

export function encryptTotpSecret(plain: string, secret = authSecret()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), encrypted.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

/** The plain secret, or null when the stored value is malformed, tampered with or encrypted under another key. */
export function decryptTotpSecret(stored: string | null | undefined, secret = authSecret()): string | null {
  if (!stored) return null;
  const [version, iv, encrypted, tag] = stored.split(".");
  if (version !== VERSION || !iv || !encrypted || !tag) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
