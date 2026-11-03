/**
 * wachtwoord-instellen/[token]/page.tsx
 * WAT:    Pagina achter een uitnodigings- of resetlink: de gebruiker kiest zelf een wachtwoord.
 * WAAROM: Het token wordt hier alleen gecontroleerd om het juiste scherm te tonen; het echte
 *         verbruik (eenmalig) gebeurt atomair in `completeTokenFlow`.
 */

import Link from 'next/link'
import { findUsableToken } from '@/lib/auth-links'
import { SetPasswordForm } from '@/components/shared/AccountForms'
import { AuthShell } from '@/components/shared/AuthShell'

export const metadata = { title: 'Wachtwoord instellen — Pansa ATS', robots: { index: false } }

export default async function SetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const row = await findUsableToken(token)

  if (!row) {
    return (
      <AuthShell
        title="Link niet meer geldig"
        subtitle="Deze link is verlopen of al gebruikt. Vraag een nieuwe aan; dat kan zelf, of via HR."
      >
        <Link href="/wachtwoord-vergeten" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Nieuwe link aanvragen
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={row.purpose === 'invite' ? 'Welkom bij Pansa ATS' : 'Nieuw wachtwoord'}
      subtitle={`Kies een wachtwoord voor ${row.email}.`}
    >
      <SetPasswordForm token={token} />
    </AuthShell>
  )
}
