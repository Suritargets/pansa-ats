/**
 * auth-tokens.ts
 * WAT:    Pure logica voor uitnodigings- en wachtwoord-reset-tokens: aanmaken, hashen, verloop.
 * WAAROM: Alleen de sha256-hash gaat de database in (zoals bij api_keys); het token zelf bestaat
 *         enkel in de link. Geen database-import, zodat dit los te testen is.
 */

import { createHash, randomBytes } from 'crypto'
import type { AuthTokenPurpose } from '../../drizzle/schema'

export const TOKEN_TTL_MS: Record<AuthTokenPurpose, number> = {
  invite: 72 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
}

/** 32 willekeurige bytes als base64url — 43 tekens, veilig in een URL-pad. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function tokenExpiresAt(purpose: AuthTokenPurpose, now: Date = new Date()): Date {
  return new Date(now.getTime() + TOKEN_TTL_MS[purpose])
}

/** Een token is bruikbaar als het nog niet gebruikt is en niet verlopen. */
export function isTokenUsable(row: { usedAt: Date | null; expiresAt: Date }, now: Date = new Date()): boolean {
  return row.usedAt === null && row.expiresAt.getTime() > now.getTime()
}

/** Een token-string uit een URL moet er plausibel uitzien voordat we de database raadplegen. */
export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}
