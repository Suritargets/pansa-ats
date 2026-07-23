/**
 * AdminShell.tsx
 * WAT:    Layout voor alle staff-admin-schermen: collapsible sidebar + topbar.
 * WAAROM: `session` komt van `requireSession()` in de server-page — server component,
 *         geen client-side auth-fetch nodig.
 */

import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/admin/Sidebar'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { getSidebarCollapsed } from '@/lib/sidebar'
import { logoutAction } from '@/services/auth-actions'
import type { SessionData } from '@/lib/auth'

export async function AdminShell({ session, children }: { session: SessionData; children: React.ReactNode }) {
  const collapsed = await getSidebarCollapsed()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={session.role} initialCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <span className="shrink-0 text-sm text-muted-foreground">Welkom, {session.fullName}</span>
          <CommandPalette role={session.role} />
          <form action={logoutAction.bind(null, '/admin')} className="shrink-0">
            <Button type="submit" variant="ghost">
              Uitloggen
            </Button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
