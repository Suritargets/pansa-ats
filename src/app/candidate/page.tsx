/**
 * candidate/page.tsx
 * WAT:    Login-scherm voor kandidaten om hun eigen sollicitatiestatus te bekijken.
 */

import { LoginForm } from '@/components/shared/LoginForm'

export default function CandidateLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-xl font-bold text-foreground">Pansa ATS — Mijn sollicitatie</h1>
      <p className="mb-6 text-sm text-muted-foreground">Bekijk de status van je sollicitatie.</p>
      <LoginForm />
    </main>
  )
}
