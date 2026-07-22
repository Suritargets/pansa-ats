'use server'

/**
 * auth-actions.ts
 * WAT:    Server Actions voor in- en uitloggen (roept lib/auth.ts aan).
 */

import { redirect } from 'next/navigation'
import { destroySession, login } from '@/lib/auth'

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

  redirect(session.role === 'client' ? '/client/dashboard' : '/admin/dashboard')
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/admin')
}
