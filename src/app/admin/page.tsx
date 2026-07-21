/**
 * admin/page.tsx
 * WAT:    Login-scherm voor staff (recruiter, HR, super_admin) en klantgebruikers.
 */

import { LoginForm } from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-xl font-bold text-foreground">Pansa ATS — Staff login</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Alleen voor medewerkers en toegewezen klantaccounts.
      </p>
      <LoginForm />
    </main>
  )
}
