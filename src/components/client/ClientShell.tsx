/**
 * ClientShell.tsx
 * WAT:    Gedeelde layout voor het klantportaal: topbar met bedrijfsnaam en uitloggen.
 * WAAROM: Zelfde patroon als AdminShell — `session` komt van `requireSession(['client'])`
 *         in de server-page, dus dit blijft een gewone server component.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/services/auth-actions'
import type { SessionData } from '@/lib/auth'

export function ClientShell({ session, children }: { session: SessionData; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/client/dashboard" className="font-heading font-semibold text-foreground">
            Pansa ATS — Klantportaal
          </Link>
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
