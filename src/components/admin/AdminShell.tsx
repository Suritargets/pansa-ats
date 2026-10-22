/**
 * AdminShell.tsx
 * WAT:    Layout voor alle staff-admin-schermen: collapsible sidebar + topbar.
 * WAAROM: `session` komt van `requireSession()` in de server-page — server component,
 *         geen client-side auth-fetch nodig.
 */

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/admin/Sidebar'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { getSidebarCollapsed } from '@/lib/sidebar'
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
  const collapsed = await getSidebarCollapsed()

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar role={session.role} initialCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
          <CommandPalette role={session.role} />
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-3">
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
            </div>
            <form action={logoutAction.bind(null, '/admin')}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Uitloggen" title="Uitloggen">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
