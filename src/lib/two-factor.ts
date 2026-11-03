/**
 * two-factor.ts
 * WAT:    Controleert de tweede factor bij het inloggen: een TOTP-code uit de authenticator-app of een herstelcode.
 * WAAROM: Een code mag maar één keer werken: bij TOTP bewaren we de laatst gebruikte stap (atomair bijgewerkt),
 *         bij een herstelcode zetten we `used_at` met een voorwaardelijke update.
 */

import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { db } from './db'
import { decryptTotpSecret } from './totp-crypto'
import { isPlausibleTotpCode, normalizeRecoveryCode, RECOVERY_CODE_RE, hashRecoveryCode, verifyTotp } from './totp'
import { profiles, recoveryCodes } from '../../drizzle/schema'

type TotpProfile = Pick<typeof profiles.$inferSelect, 'id' | 'totpSecretEnc' | 'totpEnabledAt' | 'totpLastStep'>

export function hasTwoFactor(profile: Pick<TotpProfile, 'totpEnabledAt'>): boolean {
  return profile.totpEnabledAt !== null
}

/** Geeft true als `code` een geldige, nog niet gebruikte TOTP-code of herstelcode van dit profiel is (en markeert die als gebruikt). */
export async function verifySecondFactor(profile: TotpProfile, rawCode: string): Promise<boolean> {
  const code = rawCode.trim()
  if (isPlausibleTotpCode(code)) return consumeTotp(profile, code)
  const normalized = normalizeRecoveryCode(code)
  if (RECOVERY_CODE_RE.test(normalized)) return consumeRecoveryCode(profile.id, normalized)
  return false
}

/** Controleert een TOTP-code voor de setup/uitschakelen (zonder login): zelfde replay-bescherming. */
export async function consumeTotp(profile: Pick<TotpProfile, 'id' | 'totpSecretEnc' | 'totpLastStep'>, code: string): Promise<boolean> {
  const secret = decryptTotpSecret(profile.totpSecretEnc)
  if (!secret) return false
  const match = verifyTotp(secret, code)
  if (!match) return false
  // Alleen accepteren als de stap hoger is dan de laatst gebruikte: een afgeluisterde code werkt dan niet nog eens.
  const updated = await db
    .update(profiles)
    .set({ totpLastStep: match.step })
    .where(and(eq(profiles.id, profile.id), or(isNull(profiles.totpLastStep), sql`${profiles.totpLastStep} < ${match.step}`)))
    .returning({ id: profiles.id })
  return updated.length === 1
}

async function consumeRecoveryCode(profileId: string, code: string): Promise<boolean> {
  const updated = await db
    .update(recoveryCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(recoveryCodes.profileId, profileId), eq(recoveryCodes.codeHash, hashRecoveryCode(code)), isNull(recoveryCodes.usedAt)))
    .returning({ id: recoveryCodes.id })
  return updated.length === 1
}

export async function countUnusedRecoveryCodes(profileId: string): Promise<number> {
  const rows = await db
    .select({ id: recoveryCodes.id })
    .from(recoveryCodes)
    .where(and(eq(recoveryCodes.profileId, profileId), isNull(recoveryCodes.usedAt), gt(recoveryCodes.createdAt, new Date(0))))
  return rows.length
}
