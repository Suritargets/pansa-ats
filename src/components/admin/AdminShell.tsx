/**
 * AdminShell.tsx
 * WAT:    Layout voor alle staff-admin-schermen: collapsible sidebar + topbar.
 * WAAROM: `session` komt van `requireSession()` in de server-page — server component,
 *         geen client-side auth-fetch nodig.
 */

import Link from 'next/link'
import { Bell, Globe, LogOut } from 'lucide-react'
import { LogoMark } from '@/components/landing/LogoMark'
import { logoSrc } from '@/components/landing/PublicShell'
import { countAttentionItems } from '@/services/queries'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/admin/Sidebar'
import { MobileAdminNav } from '@/components/admin/MobileAdminNav'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { getSidebarCollapsed, getSidebarOpenGroups } from '@/lib/sidebar'
import { logoutAction } from '@/services/auth-actions'
import type { SessionData } from '@/lib/auth'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Beheerder',
  hr_staff: 'HR-medewerker',
  recruiter: 'Recruiter',
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export async function AdminShell({ session, children }: { session: SessionData; children: React.ReactNode }) {
  const [collapsed, openGroups, attention] = await Promise.all([getSidebarCollapsed(), getSidebarOpenGroups(), countAttentionItems()])
  const logo = logoSrc()

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden lg:flex">
        <Sidebar role={session.role} initialCollapsed={collapsed} initialOpenGroups={openGroups} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3 sm:gap-4 sm:px-6">
          <MobileAdminNav role={session.role} openGroups={openGroups} />
          <Link href="/admin/dashboard" className="hidden shrink-0 items-center gap-3 lg:flex">
            <LogoMark src={logo} size={44} />
            <span className="font-heading text-xl leading-none font-semibold tracking-wide text-foreground">
              PANSA GROUP
              <span className="block text-sm font-normal tracking-wider text-muted-foreground">OF COMPANIES N.V.</span>
            </span>
            <span className="hidden border-l border-border pl-3 text-[11px] leading-tight font-bold tracking-wider text-[var(--color-brand-dark-green)] uppercase xl:block">
              The moving force
              <br />
              of the industries
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <CommandPalette role={session.role} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/admin/contracts"
              className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted"
              aria-label={attention > 0 ? `${attention} aandachtspunten` : 'Geen aandachtspunten'}
              title="Contracten & badges"
            >
              <Bell className="size-4" />
              {attention > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">
                  {attention}
                </span>
              )}
            </Link>
            <span className="hidden h-10 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground md:flex">
              <Globe className="size-4 text-muted-foreground" />
              NL
            </span>
            <Link href="/admin/settings/account" className="flex items-center gap-3 rounded-xl" title="Mijn account" aria-label="Mijn account">
              <span
                className="flex size-10 items-center justify-center rounded-full bg-[var(--color-brand-deep)] text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {initials(session.fullName)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">{session.fullName}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[session.role] ?? session.role}</p>
              </div>
            </Link>
            <form action={logoutAction.bind(null, '/admin')}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Uitloggen" title="Uitloggen">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
