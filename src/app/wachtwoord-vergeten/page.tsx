/**
 * wachtwoord-vergeten/page.tsx
 * WAT:    Publieke pagina om een wachtwoord-resetlink aan te vragen (voor alle drie de portalen).
 */

import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/shared/AccountForms'

export const metadata = { title: 'Wachtwoord vergeten — Pansa ATS' }

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-xl font-bold text-foreground">Wachtwoord vergeten</h1>
      <p className="mb-6 text-sm text-muted-foreground">Vul je e-mailadres in; dan maken we een link om een nieuw wachtwoord te kiezen.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-muted-foreground underline-offset-4 hover:underline">
          Terug naar de voorpagina
        </Link>
      </p>
    </main>
  )
}
