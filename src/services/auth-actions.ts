'use server'

/**
 * auth-actions.ts
 * WAT:    Server Actions voor in- en uitloggen (roept lib/auth.ts aan).
 * WAAROM: Eén loginAction voor alle drie de portalen — de rol op de profiles-rij bepaalt
 *         waar de gebruiker na inloggen terechtkomt.
 */

import { redirect } from 'next/navigation'
import { destroySession, login } from '@/lib/auth'
import type { UserRole } from '../../drizzle/schema'

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin/dashboard',
  hr_staff: '/admin/dashboard',
  recruiter: '/admin/dashboard',
  client: '/client/dashboard',
  candidate: '/candidate/dashboard',
}

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Vul e-mail en wachtwoord in.' }
  }

  const session = await login(email, password)
  if (!session) {
    return { error: 'Inloggen mislukt. Controleer je e-mail en wachtwoord.' }
  }

  redirect(ROLE_HOME[session.role])
}

/**
 * Bind altijd met de juiste loginPath: `logoutAction.bind(null, '/admin' | '/client' | '/candidate')`
 * — zo weet de logout-knop in elke shell naar welke loginpagina hij terug moet.
 */
export async function logoutAction(loginPath: string): Promise<void> {
  await destroySession()
  redirect(loginPath)
}
