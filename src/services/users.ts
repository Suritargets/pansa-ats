'use server'

/**
 * users.ts
 * WAT:    Server Actions voor gebruikersbeheer (staff/client-accounts) — alleen super_admin.
 * WAAROM: Tot nu toe was het seed-script de enige manier om accounts aan te maken.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { hashPassword, requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { profiles, type UserRole } from '../../drizzle/schema'

export async function createUser(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('fullName') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'hr_staff') as UserRole
  const clientId = String(formData.get('clientId') ?? '').trim() || null

  if (!email || !fullName || password.length < 8) return

  const [created] = await db
    .insert(profiles)
    .values({
      email,
      fullName,
      role,
      clientId: role === 'client' ? clientId : null,
      passwordHash: await hashPassword(password),
    })
    .returning({ id: profiles.id })

  await logAuditEvent(session, 'user_created', { entityType: 'profile', entityId: created.id, metadata: { email, role } })
  revalidatePath('/admin/settings/users')
}

export async function toggleUserActive(id: string, active: boolean): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (session.userId === id) return // eigen account niet deactiveren
  await db.update(profiles).set({ active }).where(eq(profiles.id, id))
  await logAuditEvent(session, active ? 'user_activated' : 'user_deactivated', { entityType: 'profile', entityId: id })
  revalidatePath('/admin/settings/users')
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (session.userId === id) return // eigen rol niet wijzigen
  await db.update(profiles).set({ role }).where(eq(profiles.id, id))
  await logAuditEvent(session, 'user_role_changed', { entityType: 'profile', entityId: id, metadata: { role } })
  revalidatePath('/admin/settings/users')
}
