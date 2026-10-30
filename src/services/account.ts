'use server'

/**
 * account.ts
 * WAT:    Server Actions voor wachtwoord vergeten, wachtwoord instellen via uitnodiging/reset-link en
 *         het wijzigen van je eigen wachtwoord.
 * WAAROM: Wachtwoorden worden nooit meer door een beheerder bedacht; de gebruiker kiest zelf via een
 *         eenmalige link. Elke wachtwoordwijziging verhoogt `session_version`, waardoor eerder
 *         uitgegeven sessies direct ongeldig zijn.
 */

import { redirect } from 'next/navigation'
import { and, eq, gt, gte, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { hashPassword, refreshSession, requireSession, verifyPassword } from '@/lib/auth'
import { findUsableToken, issueAuthToken } from '@/lib/auth-links'
import { hashToken } from '@/lib/auth-tokens'
import { logAuditEvent } from '@/lib/audit'
import { validatePassword } from '@/lib/password-policy'
import { ROLE_HOME } from '@/lib/roles'
import { authTokens, profiles } from '../../drizzle/schema'

export type FormState = { error: string | null; success?: string | null }

const RESET_REQUEST_MESSAGE =
  'Als dit e-mailadres bij ons bekend is, is er een link om het wachtwoord opnieuw in te stellen aangemaakt. Ontvang je niets? Vraag HR om een nieuwe link.'
const LINK_INVALID = 'Deze link is verlopen of al gebruikt. Vraag een nieuwe link aan.'
// Zonder deze rem zou iemand een mailbox kunnen volspammen met reset-verzoeken (zodra er mail wordt verstuurd).
const RESET_COOLDOWN_MS = 2 * 60 * 1000

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Vul je e-mailadres in.' }

  const [profile] = await db.select().from(profiles).where(eq(profiles.email, email))
  if (profile?.active) {
    const [recent] = await db
      .select({ id: authTokens.id })
      .from(authTokens)
      .where(
        and(
          eq(authTokens.profileId, profile.id),
          eq(authTokens.purpose, 'password_reset'),
          gte(authTokens.createdAt, new Date(Date.now() - RESET_COOLDOWN_MS))
        )
      )
      .limit(1)
    if (!recent) {
      await issueAuthToken(profile.id, 'password_reset', null)
      await logAuditEvent({ userId: null, email }, 'password_reset_requested', { entityType: 'profile', entityId: profile.id })
    }
  }
  // Altijd dezelfde melding, ook voor onbekende adressen.
  return { error: null, success: RESET_REQUEST_MESSAGE }
}

export async function completeTokenFlow(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  const row = await findUsableToken(token)
  if (!row) return { error: LINK_INVALID }

  const policyError = validatePassword(password, row.email)
  if (policyError) return { error: policyError }
  if (password !== confirm) return { error: 'De twee wachtwoorden zijn niet gelijk.' }

  // Het token claimen is één atomaire UPDATE: bij twee gelijktijdige verzoeken wint er precies één.
  const claimed = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.tokenHash, hashToken(token)), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .returning({ id: authTokens.id })
  if (claimed.length === 0) return { error: LINK_INVALID }

  await db
    .update(profiles)
    .set({
      passwordHash: await hashPassword(password),
      passwordChangedAt: new Date(),
      sessionVersion: sql`${profiles.sessionVersion} + 1`,
    })
    .where(eq(profiles.id, row.profileId))
  await logAuditEvent(
    { userId: row.profileId, email: row.email },
    row.purpose === 'invite' ? 'invite_accepted' : 'password_reset_completed',
    { entityType: 'profile', entityId: row.profileId }
  )

  const session = await refreshSession(row.profileId)
  if (!session) return { error: LINK_INVALID }
  redirect(ROLE_HOME[session.role])
}

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession()
  const current = String(formData.get('current') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, session.userId))
  if (!profile || !(await verifyPassword(current, profile.passwordHash))) {
    return { error: 'Het huidige wachtwoord klopt niet.' }
  }
  const policyError = validatePassword(password, profile.email)
  if (policyError) return { error: policyError }
  if (password !== confirm) return { error: 'De twee wachtwoorden zijn niet gelijk.' }
  if (await verifyPassword(password, profile.passwordHash)) return { error: 'Kies een ander wachtwoord dan het huidige.' }

  await db
    .update(profiles)
    .set({
      passwordHash: await hashPassword(password),
      passwordChangedAt: new Date(),
      sessionVersion: sql`${profiles.sessionVersion} + 1`,
    })
    .where(eq(profiles.id, profile.id))
  await logAuditEvent(session, 'password_changed', { entityType: 'profile', entityId: profile.id })

  // Alle oude sessies zijn nu ongeldig; houd de huidige gebruiker ingelogd met een nieuwe.
  await refreshSession(profile.id)
  return { error: null, success: 'Wachtwoord gewijzigd. Andere apparaten zijn uitgelogd.' }
}
