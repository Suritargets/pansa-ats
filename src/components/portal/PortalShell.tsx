/**
 * PortalShell.tsx
 * WAT:    Donkere app-schil voor het kandidaat- en klantportaal, mobile-first (ontwerp "Pansa ATS mobile"):
 *         compacte kop (terug, titel, actie) of een eigen hero, content op witte kaarten, onderbalk met
 *         vier tabs op telefoon. Vanaf md een gewone topbalk met logo, menu en gebruiker, zonder onderbalk.
 * WAAROM: Eén schil voor beide portalen en voor de publieke vacaturepagina's (`session = null`): wie niet
 *         is ingelogd ziet dezelfde navigatie, met beschermde tabs richting de loginpagina.
 */

import Link from 'next/link'
import { ChevronLeft, LogIn, LogOut } from 'lucide-react'
import { Avatar } from '@/components/admin/Avatar'
import { LogoMark } from '@/components/landing/LogoMark'
import { logoSrc } from '@/components/landing/PublicShell'
import { MobileBottomNav, type BottomNavItem } from '@/components/portal/MobileBottomNav'
import { CANDIDATE_TABS, CLIENT_TABS } from '@/constants/nav'
import { logoutAction } from '@/services/auth-actions'
import type { SessionData } from '@/lib/auth'
import { cn } from '@/lib/utils'

export type PortalVariant = 'candidate' | 'client'

const LOGIN_PATH: Record<PortalVariant, string> = { candidate: '/candidate', client: '/client' }

export function PortalShell({
  variant,
  session,
  title,
  back,
  action,
  hero,
  bottomNav = true,
  wide = false,
  children,
}: {
  variant: PortalVariant
  session: SessionData | null
  /** Titel in de compacte mobiele kop. */
  title?: string
  /** Terugpijl in de compacte kop (pad). */
  back?: string
  /** Rechts in de compacte kop (bv. zoek- of instellingenknop). */
  action?: React.ReactNode
  /** Vervangt de compacte mobiele kop (bv. begroeting met foto). */
  hero?: React.ReactNode
  bottomNav?: boolean
  /** Brede inhoud op desktop (max-w-5xl i.p.v. max-w-3xl). */
  wide?: boolean
  children: React.ReactNode
}) {
  const logo = logoSrc()
  const tabs = variant === 'candidate' ? CANDIDATE_TABS : CLIENT_TABS
  const loginPath = LOGIN_PATH[variant]
  const items: BottomNavItem[] = tabs.map((tab) => ({
    label: tab.label,
    icon: tab.icon,
    match: tab.href,
    href: tab.protected && !session ? loginPath : tab.href,
  }))
  const roleLabel = variant === 'candidate' ? 'Kandidaat' : 'Klantportaal'

  return (
    <div
      className="min-h-dvh bg-[#0b100c] text-white"
      style={{ ['--mode' as string]: variant === 'candidate' ? 'var(--color-brand-lime)' : 'var(--color-brand-yellow)' }}
    >
      {/* Desktop-topbalk */}
      <header className="hidden border-b border-white/10 bg-[#0d130e] md:block">
        <div className={cn('mx-auto flex items-center gap-6 px-6 py-3', wide ? 'max-w-5xl' : 'max-w-3xl')}>
          <Link href="/" className="flex items-center gap-3">
            <LogoMark src={logo} size={36} />
            <span className="font-heading text-lg leading-none font-semibold tracking-wide">
              PANSA GROUP
              <span className="block text-xs font-normal tracking-wider text-white/70">{roleLabel.toUpperCase()}</span>
            </span>
          </Link>
          <nav className="flex flex-1 gap-1 text-sm font-medium">
            {items.map((item) => (
              <Link key={item.match} href={item.href} className="rounded-lg px-3 py-2 text-white/75 hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          {session ? (
            <div className="flex items-center gap-3 text-sm">
              <Avatar name={session.fullName} size="sm" />
              <span className="text-white/80">{session.fullName}</span>
              <form action={logoutAction.bind(null, loginPath)}>
                <button type="submit" className="flex size-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Uitloggen" title="Uitloggen">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          ) : (
            <Link href={loginPath} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              <LogIn className="size-4" />
              Inloggen
            </Link>
          )}
        </div>
      </header>

      {/* Mobiele kop */}
      <div className="md:hidden">
        {hero ?? (
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-[#0b100c]/95 px-3 py-3 backdrop-blur">
            {back ? (
              <Link href={back} aria-label="Terug" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
                <ChevronLeft className="size-6" />
              </Link>
            ) : (
              <span className="size-10" />
            )}
            <h1 className="flex-1 truncate font-sans text-lg font-bold">{title}</h1>
            <div className="flex min-w-10 justify-end">{action}</div>
          </header>
        )}
      </div>

      <main className={cn('mx-auto px-4 pt-4 md:px-6 md:pt-8', bottomNav ? 'pb-28 md:pb-12' : 'pb-12', wide ? 'max-w-5xl' : 'max-w-3xl')}>
        {title && <h1 className="mb-5 hidden font-sans text-3xl font-black tracking-tight uppercase italic md:block">{title}</h1>}
        {children}
      </main>

      {bottomNav && <MobileBottomNav items={items} />}
    </div>
  )
}

/** Witte kaart zoals in het mobiele ontwerp — de bouwsteen voor lijsten en blokken op de donkere schil. */
export function WhiteCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-2xl bg-white p-4 text-[#10150f] shadow-sm', className)}>{children}</div>
}

/** Blokkop met optioneel rechts een link ("Bekijk alle"). */
export function SectionTitle({ title, href, linkLabel = 'Bekijk alle' }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mt-6 mb-3 flex items-baseline justify-between">
      <h2 className="font-sans text-lg font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-[var(--color-brand-lime)] hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

/** Horizontaal scrollbare filterchips (links, geen state: de pagina leest `?filter=`). */
export function ChipBar({ chips }: { chips: { label: string; href: string; active: boolean }[] }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          aria-current={chip.active ? 'true' : undefined}
          className={cn(
            'shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            chip.active ? 'bg-[var(--color-brand-lime)] text-[#0b100c]' : 'bg-white/10 text-white/85 hover:bg-white/15'
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  )
}

/** Statistiektegel zoals in het mobiele ontwerp (icoon links, waarde + label rechts). */
export function StatTile({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: import('lucide-react').LucideIcon
  value: string | number
  label: string
  hint?: string
}) {
  return (
    <WhiteCard className="flex items-center gap-3 p-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-deep)] text-white">
        <Icon className="size-6" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-3xl leading-none font-semibold tabular-nums">{value}</span>
        <span className="block text-xs leading-tight text-[#5b6558]">{label}</span>
        {hint && <span className="block text-[11px] font-semibold text-[#1c9848]">{hint}</span>}
      </span>
    </WhiteCard>
  )
}
