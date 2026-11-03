'use server'

/**
 * two-factor.ts
 * WAT:    Server Actions voor tweestapsverificatie van je eigen account: instellen (QR + bevestigen),
 *         herstelcodes opnieuw maken en uitschakelen.
 * WAAROM: Het geheim wordt versleuteld bewaard en pas actief na bevestiging met een eerste geldige code.
 *         Het inloggen zelf staat in lib/auth.ts (`login`).
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import qrcode from 'qrcode-generator'
import { db } from '@/lib/db'
import { requireSession, verifyPassword } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { consumeTotp } from '@/lib/two-factor'
import { decryptTotpSecret, encryptTotpSecret } from '@/lib/totp-crypto'
import { generateRecoveryCodes, generateSecret, hashRecoveryCode, otpauthUri } from '@/lib/totp'
import { profiles, recoveryCodes } from '../../drizzle/schema'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const ISSUER = 'Pansa ATS'
const BAD_CODE = 'Deze code klopt niet. Controleer de code in je authenticator-app en probeer het opnieuw.'

async function currentProfile() {
  const session = await requireSession(undefined, '/admin')
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, session.userId))
  return { session, profile }
}

async function replaceRecoveryCodes(profileId: string): Promise<string[]> {
  const codes = generateRecoveryCodes()
  await db.delete(recoveryCodes).where(eq(recoveryCodes.profileId, profileId))
  await db.insert(recoveryCodes).values(codes.map((code) => ({ profileId, codeHash: hashRecoveryCode(code) })))
  return codes
}

/** Stap 1: een nieuw geheim (als tekst en QR) zolang tweestapsverificatie nog uit staat. */
export async function beginTotpSetup(): Promise<Result<{ secret: string; qrSvg: string }>> {
  const { session, profile } = await currentProfile()
  if (profile.totpEnabledAt) return { ok: false, error: 'Tweestapsverificatie staat al aan.' }
  const secret = generateSecret()
  await db.update(profiles).set({ totpSecretEnc: encryptTotpSecret(secret), totpLastStep: null }).where(eq(profiles.id, profile.id))
  const qr = qrcode(0, 'M')
  qr.addData(otpauthUri({ issuer: ISSUER, account: session.email, secret }))
  qr.make()
  return { ok: true, secret, qrSvg: qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) }
}

/** Stap 2: de eerste code uit de app zet het aan; de herstelcodes komen één keer terug. */
export async function confirmTotpSetup(code: string): Promise<Result<{ recoveryCodes: string[] }>> {
  const { session, profile } = await currentProfile()
  if (profile.totpEnabledAt) return { ok: false, error: 'Tweestapsverificatie staat al aan.' }
  if (!decryptTotpSecret(profile.totpSecretEnc)) return { ok: false, error: 'Begin de installatie opnieuw.' }
  if (!(await consumeTotp(profile, code.trim()))) return { ok: false, error: BAD_CODE }
  await db.update(profiles).set({ totpEnabledAt: new Date() }).where(eq(profiles.id, profile.id))
  const codes = await replaceRecoveryCodes(profile.id)
  await logAuditEvent(session, '2fa_enabled', { entityType: 'profile', entityId: profile.id })
  revalidatePath('/admin/settings/account')
  return { ok: true, recoveryCodes: codes }
}

/** Nieuwe herstelcodes (de oude werken daarna niet meer); vraagt een geldige code uit de app. */
export async function regenerateRecoveryCodes(code: string): Promise<Result<{ recoveryCodes: string[] }>> {
  const { session, profile } = await currentProfile()
  if (!profile.totpEnabledAt) return { ok: false, error: 'Tweestapsverificatie staat niet aan.' }
  if (!(await consumeTotp(profile, code.trim()))) return { ok: false, error: BAD_CODE }
  const codes = await replaceRecoveryCodes(profile.id)
  await logAuditEvent(session, '2fa_recovery_codes_regenerated', { entityType: 'profile', entityId: profile.id })
  return { ok: true, recoveryCodes: codes }
}

/** Uitschakelen: wachtwoord én een geldige code uit de app. */
export async function disableTotp(password: string, code: string): Promise<Result> {
  const { session, profile } = await currentProfile()
  if (!profile.totpEnabledAt) return { ok: false, error: 'Tweestapsverificatie staat niet aan.' }
  if (!(await verifyPassword(password, profile.passwordHash))) return { ok: false, error: 'Je wachtwoord klopt niet.' }
  if (!(await consumeTotp(profile, code.trim()))) return { ok: false, error: BAD_CODE }
  await db.update(profiles).set({ totpSecretEnc: null, totpEnabledAt: null, totpLastStep: null }).where(eq(profiles.id, profile.id))
  await db.delete(recoveryCodes).where(eq(recoveryCodes.profileId, profile.id))
  await logAuditEvent(session, '2fa_disabled', { entityType: 'profile', entityId: profile.id })
  revalidatePath('/admin/settings/account')
  return { ok: true }
}

/** Beheerder: tweestapsverificatie van een gebruiker wissen (bv. telefoon kwijt en geen herstelcodes). */
export async function adminResetTwoFactor(profileId: string): Promise<Result> {
  const session = await requireSession(['super_admin'])
  await db.update(profiles).set({ totpSecretEnc: null, totpEnabledAt: null, totpLastStep: null }).where(eq(profiles.id, profileId))
  await db.delete(recoveryCodes).where(eq(recoveryCodes.profileId, profileId))
  await logAuditEvent(session, '2fa_reset_by_admin', { entityType: 'profile', entityId: profileId })
  revalidatePath('/admin/settings/users')
  return { ok: true }
}
