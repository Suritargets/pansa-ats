/**
 * wachtwoord-instellen/[token]/page.tsx
 * WAT:    Pagina achter een uitnodigings- of resetlink: de gebruiker kiest zelf een wachtwoord.
 * WAAROM: Het token wordt hier alleen gecontroleerd om het juiste scherm te tonen; het echte
 *         verbruik (eenmalig) gebeurt atomair in `completeTokenFlow`.
 */

import Link from 'next/link'
import { findUsableToken } from '@/lib/auth-links'
import { SetPasswordForm } from '@/components/shared/AccountForms'

export const metadata = { title: 'Wachtwoord instellen — Pansa ATS', robots: { index: false } }

export default async function SetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const row = await findUsableToken(token)

  if (!row) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="mb-1 text-xl font-bold text-foreground">Link niet meer geldig</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Deze link is verlopen of al gebruikt. Vraag een nieuwe aan; dat kan zelf, of via HR.
        </p>
        <Link href="/wachtwoord-vergeten" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Nieuwe link aanvragen
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-xl font-bold text-foreground">{row.purpose === 'invite' ? 'Welkom bij Pansa ATS' : 'Nieuw wachtwoord'}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Kies een wachtwoord voor <span className="font-medium text-foreground">{row.email}</span>.
      </p>
      <SetPasswordForm token={token} />
    </main>
  )
}
