/**
 * AdminShell.tsx
 * WAT:    Gedeelde layout voor alle admin-schermen: topbar met navigatie + uitloggen.
 * WAAROM: `session` komt van `requireSession()` in de server-page — geen client-side
 *         auth-fetch meer nodig, dus dit kan een gewone server component zijn.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/services/auth-actions'
import type { SessionData } from '@/lib/auth'

export function AdminShell({ session, children }: { session: SessionData; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="font-heading font-semibold text-foreground">
              Pansa ATS
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/digitize" className="hover:text-foreground">
                Digitaliseren
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session.fullName}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">
                Uitloggen
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  )
}
