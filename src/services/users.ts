'use server'

/**
 * users.ts
 * WAT:    Server Actions voor gebruikersbeheer (staff/client-accounts) — alleen super_admin.
 * WAAROM: Een beheerder kiest nooit meer een wachtwoord voor iemand anders: een nieuw account krijgt
 *         een onbruikbaar wachtwoord plus een eenmalige uitnodigingslink waarmee de gebruiker zelf
 *         een wachtwoord instelt. De link wordt één keer getoond (tot de e-mailkoppeling er is).
 *         Deactiveren en rolwijzigingen verhogen `session_version`, zodat lopende sessies direct stoppen.
 */

import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { hashPassword, requireSession } from '@/lib/auth'
import { buildSetPasswordLink, issueAuthToken } from '@/lib/auth-links'
import { generateToken } from '@/lib/auth-tokens'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { profiles, userRoleEnum, type UserRole } from '../../drizzle/schema'

export type CreateUserState = { error: string | null; link?: string; email?: string }

// Kandidaat-accounts worden niet door een beheerder aangemaakt: die koppelen aan een kandidaat-record.
const CREATABLE_ROLES = userRoleEnum.enumValues.filter((role) => role !== 'candidate')

function isCreatableRole(value: string): value is UserRole {
  return (CREATABLE_ROLES as string[]).includes(value)
}

export async function createUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('fullName') ?? '').trim()
  const role = String(formData.get('role') ?? 'hr_staff')
  const clientId = String(formData.get('clientId') ?? '').trim() || null

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Vul een geldig e-mailadres in.' }
  if (!fullName) return { error: 'Vul een naam in.' }
  if (!isCreatableRole(role)) return { error: 'Kies een geldige rol.' }
  if (role === 'client' && !clientId) return { error: 'Kies de client waaraan dit account hoort.' }

  const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email))
  if (existing) return { error: 'Dit e-mailadres is al in gebruik.' }

  const [created] = await db
    .insert(profiles)
    .values({
      email,
      fullName,
      role,
      clientId: role === 'client' ? clientId : null,
      // Onbruikbaar wachtwoord: niemand kent het; de gebruiker stelt het zelf in via de uitnodiging.
      passwordHash: await hashPassword(generateToken()),
    })
    .returning({ id: profiles.id })

  const token = await issueAuthToken(created.id, 'invite', session.userId)
  await logAuditEvent(session, 'user_created', { entityType: 'profile', entityId: created.id, metadata: { email, role } })
  await logAuditEvent(session, 'invite_issued', { entityType: 'profile', entityId: created.id })
  revalidatePath('/admin/settings/users')
  return { error: null, link: await buildSetPasswordLink(token), email }
}

/** Nieuwe eenmalige link (72 uur geldig) voor een bestaand account, bv. bij een vergeten wachtwoord. */
export async function createAccessLink(id: string): Promise<{ error: string | null; link?: string }> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const [profile] = await db.select({ id: profiles.id, active: profiles.active }).from(profiles).where(eq(profiles.id, id))
  if (!profile) return { error: 'Account niet gevonden.' }
  if (!profile.active) return { error: 'Dit account is gedeactiveerd.' }

  const token = await issueAuthToken(id, 'invite', session.userId)
  await logAuditEvent(session, 'invite_issued', { entityType: 'profile', entityId: id })
  return { error: null, link: await buildSetPasswordLink(token) }
}

export async function toggleUserActive(id: string, active: boolean): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (session.userId === id) return // eigen account niet deactiveren
  await db
    .update(profiles)
    .set({ active, sessionVersion: sql`${profiles.sessionVersion} + 1` })
    .where(eq(profiles.id, id))
  await logAuditEvent(session, active ? 'user_activated' : 'user_deactivated', { entityType: 'profile', entityId: id })
  revalidatePath('/admin/settings/users')
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (session.userId === id) return // eigen rol niet wijzigen
  if (!isCreatableRole(role)) return // geen kandidaat-rol toekennen en geen onbekende waarden
  await db
    .update(profiles)
    .set({ role, sessionVersion: sql`${profiles.sessionVersion} + 1` })
    .where(eq(profiles.id, id))
  await logAuditEvent(session, 'user_role_changed', { entityType: 'profile', entityId: id, metadata: { role } })
  revalidatePath('/admin/settings/users')
}
