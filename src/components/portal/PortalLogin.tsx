/**
 * PortalLogin.tsx
 * WAT:    Inlogscherm voor het kandidaat- en klantportaal in het donkere mobiele ontwerp: logo, kop,
 *         witte kaart met het formulier en een link terug naar de voorpagina.
 */

import Link from 'next/link'
import { LoginForm } from '@/components/shared/LoginForm'
import { LogoMark } from '@/components/landing/LogoMark'
import { logoSrc } from '@/components/landing/PublicShell'

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
    <main
      className="flex min-h-dvh flex-col bg-[#0b100c] bg-cover bg-center px-5 py-8 text-white"
      style={{
        backgroundImage: 'linear-gradient(180deg,rgba(11,16,12,.35),#0b100c 85%),url(/landing/hero.jpg)',
        ['--mode' as string]: variant === 'candidate' ? 'var(--color-brand-lime)' : 'var(--color-brand-yellow)',
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark src={logoSrc()} size={72} />
          <p className="mt-3 font-heading text-2xl leading-none font-semibold tracking-wide">
            PANSA GROUP
            <span className="block text-sm font-normal tracking-wider text-white/75">OF COMPANIES N.V.</span>
          </p>
          <p className="mt-1 text-[11px] font-bold tracking-wider text-[var(--color-brand-yellow)] uppercase">The moving force of the industries</p>
        </div>

        <h1 className="font-sans text-3xl font-black italic">
          <span className="text-[var(--mode)]">{title}</span>
        </h1>
        <p className="mt-1 mb-5 text-white/80">{subtitle}</p>

        <div className="rounded-2xl bg-white p-5 text-[#10150f] shadow-xl">
          <LoginForm />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-white/70">
          {variant === 'candidate' && (
            <Link href="/apply" className="font-semibold text-[var(--mode)] hover:underline">
              Nog geen account? Solliciteer eerst
            </Link>
          )}
          <Link href={variant === 'candidate' ? '/' : '/?mode=bedrijven'} className="hover:text-white">
            Terug naar de voorpagina
          </Link>
        </div>
      </div>
    </main>
  )
}
