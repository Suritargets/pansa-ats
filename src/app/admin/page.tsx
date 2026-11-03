/**
 * admin/page.tsx
 * WAT:    Login-scherm voor staff (super_admin, hr_staff, recruiter).
 */

import { LoginForm } from '@/components/shared/LoginForm'
import { AuthShell } from '@/components/shared/AuthShell'

export default function AdminLoginPage() {
  return (
    <AuthShell title="Staff login" subtitle="Alleen voor medewerkers.">
      <LoginForm />
    </AuthShell>
  )
}
