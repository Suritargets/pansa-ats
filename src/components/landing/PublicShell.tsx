/**
 * PublicShell.tsx
 * WAT:    Donkere schil voor de publieke pagina's achter de voorpagina (vacatures, trainingen, nieuws,
 *         bedrijven, talentenpool, diensten): topbar met logo en navigatie, paginakop, voettekst.
 * WAAROM: Server component — zelfde kleuren/clip-hoeken als LandingPage zodat het één site blijft.
 *         `mode` bepaalt de accentkleur (lime voor kandidaten, geel voor bedrijven) en de navigatie.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import { ChevronLeft, LogIn } from 'lucide-react'
import { LogoMark } from '@/components/landing/LogoMark'
import { cn } from '@/lib/utils'

export type PublicMode = 'werkzoeken' | 'bedrijven'

const NAV: Record<PublicMode, { label: string; href: string }[]> = {
  werkzoeken: [
    { label: 'Vacatures', href: '/vacatures' },
    { label: 'Trainingen', href: '/trainingen' },
    { label: 'Nieuws', href: '/nieuws' },
    { label: 'Bedrijven', href: '/bedrijven' },
  ],
  bedrijven: [
    { label: 'Vacature plaatsen', href: '/request-staffing' },
    { label: 'Talentenpool', href: '/talentenpool' },
    { label: 'Diensten', href: '/diensten' },
    { label: 'Bedrijven', href: '/bedrijven' },
  ],
}

export function logoSrc(): string | null {
  return ['logo.svg', 'logo.png'].map((f) => `/landing/${f}`).find((f) => existsSync(join(process.cwd(), 'public', f))) ?? null
}

export function PublicShell({
  mode,
  eyebrow = 'Pansa Group',
  title,
  intro,
  children,
}: {
  mode: PublicMode
  eyebrow?: string
  title: string
  intro?: string
  children: React.ReactNode
}) {
  const logo = logoSrc()
  const isCandidate = mode === 'werkzoeken'

  return (
    <div
      className="min-h-screen bg-[#0b100c] text-white"
      style={{ ['--mode' as string]: isCandidate ? 'var(--color-brand-lime)' : 'var(--color-brand-yellow)' }}
    >
      <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 pt-5 sm:px-8">
        <Link href={`/?mode=${mode}`} className="flex items-center gap-3">
          <LogoMark src={logo} size={44} />
          <span className="font-heading text-xl leading-none font-semibold tracking-wide">
            PANSA GROUP
            <span className="block text-sm font-normal tracking-wider text-white/80">OF COMPANIES N.V.</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm font-medium md:mx-auto">
          {NAV[mode].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href={isCandidate ? '/candidate' : '/client'}
          className="ml-auto flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          <LogIn className="size-4" />
          Inloggen
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-8">
        <Link href={`/?mode=${mode}`} className="mb-6 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
          <ChevronLeft className="size-4" />
          Terug naar de voorpagina
        </Link>
        <p className="text-sm font-bold tracking-[0.2em] text-white/80 uppercase">{eyebrow}</p>
        <h1 className="mt-2 font-sans text-4xl leading-none font-black tracking-tight uppercase italic sm:text-5xl">
          <span className="text-[var(--mode)]">{title}</span>
        </h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-white/85">{intro}</p>}
        <div className="mt-10">{children}</div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-white/50 sm:px-8">
        © Pansa Group of Companies N.V. · Martin Luther Kingweg km 23, Para, Suriname · recruitment@hpsnv.com
      </footer>
    </div>
  )
}

/** Donker paneel met afgeschuinde hoeken — de bouwsteen van alle publieke pagina's. */
export function Panel({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className={cn('clip-tech-sm scroll-mt-24 border border-white/10 bg-[#121812] p-5', className)}>
      {children}
    </section>
  )
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading text-2xl leading-none font-semibold tracking-wide uppercase">{children}</h2>
}

export function Tag({ children, tone = 'outline' }: { children: React.ReactNode; tone?: 'outline' | 'mode' | 'green' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase',
        tone === 'outline' && 'border border-white/20 text-white/80',
        tone === 'mode' && 'bg-[var(--mode)] text-[#0b100c]',
        tone === 'green' && 'bg-[var(--color-brand-green)] text-white'
      )}
    >
      {children}
    </span>
  )
}

/** Gele actieknop (zelfde als de CTA op de voorpagina). */
export function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="clip-tech-sm inline-flex items-center gap-2 self-start bg-[var(--color-brand-yellow)] px-5 py-3 font-heading text-xl font-semibold tracking-wide text-[#0b100c] uppercase hover:bg-[#ffd94d] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      {children}
    </Link>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-white/15 px-4 py-8 text-center text-white/70">{children}</p>
}
