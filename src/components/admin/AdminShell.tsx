/**
 * AdminShell.tsx
 * WAT:    Layout voor alle staff-admin-schermen: collapsible sidebar + topbar.
 * WAAROM: `session` komt van `requireSession()` in de server-page — server component,
 *         geen client-side auth-fetch nodig.
 */

import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/admin/Sidebar'
import { getSidebarCollapsed } from '@/lib/sidebar'
import { logoutAction } from '@/services/auth-actions'
import { ADMIN_NAV } from '@/constants/nav'
import type { SessionData } from '@/lib/auth'

export async function AdminShell({ session, children }: { session: SessionData; children: React.ReactNode }) {
  const collapsed = await getSidebarCollapsed()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar groups={ADMIN_NAV} role={session.role} initialCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <span className="text-sm text-muted-foreground">Welkom, {session.fullName}</span>
          <form action={logoutAction.bind(null, '/admin')}>
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
