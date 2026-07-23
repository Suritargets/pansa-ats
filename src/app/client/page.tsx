/**
 * client/page.tsx
 * WAT:    Login-scherm voor klantaccounts (mijnbouwbedrijven zoals RGM).
 */

import { LoginForm } from '@/components/shared/LoginForm'

export default function ClientLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-xl font-bold text-foreground">Pansa ATS — Klantportaal</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Voor klantbedrijven om gedeelde kandidaatprofielen te bekijken en vacatures aan te vragen.
      </p>
      <LoginForm />
    </main>
  )
}
