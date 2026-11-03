/**
 * wachtwoord-vergeten/page.tsx
 * WAT:    Publieke pagina om een wachtwoord-resetlink aan te vragen (voor alle drie de portalen).
 */

import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/shared/AccountForms'
import { AuthShell } from '@/components/shared/AuthShell'

export const metadata = { title: 'Wachtwoord vergeten — Pansa ATS' }

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Wachtwoord vergeten"
      subtitle="Vul je e-mailadres in; dan maken we een link om een nieuw wachtwoord te kiezen."
      footer={
        <Link href="/" className="hover:underline">
          Terug naar de voorpagina
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
