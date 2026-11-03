/**
 * PortalLogin.tsx
 * WAT:    Inlogscherm voor het kandidaat- en klantportaal: gedeelde AuthShell met het loginformulier
 *         en een link terug naar de voorpagina.
 */

import Link from 'next/link'
import { LoginForm } from '@/components/shared/LoginForm'
import { AuthShell } from '@/components/shared/AuthShell'

export function PortalLogin({
  variant,
  title,
  subtitle,
}: {
  variant: 'candidate' | 'client'
  title: string
  subtitle: string
}) {
  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      accent={variant === 'candidate' ? 'var(--color-brand-lime)' : 'var(--color-brand-yellow)'}
      footer={
        <>
          {variant === 'candidate' && (
            <Link href="/apply" className="font-semibold hover:underline">
              Nog geen account? Solliciteer eerst
            </Link>
          )}
          <Link href={variant === 'candidate' ? '/' : '/?mode=bedrijven'} className="hover:underline">
            Terug naar de voorpagina
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
