/**
 * CandidateShell.tsx
 * WAT:    Layout voor de candidate-portal-schermen — platte topbar (2-3 pagina's).
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/services/auth-actions'
import { CANDIDATE_NAV } from '@/constants/nav'
import type { SessionData } from '@/lib/auth'

export function CandidateShell({ session, children }: { session: SessionData; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/candidate/dashboard" className="font-heading font-semibold text-foreground">
              Pansa ATS — Mijn sollicitatie
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              {CANDIDATE_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session.fullName}</span>
            <form action={logoutAction.bind(null, '/candidate')}>
              <Button type="submit" variant="ghost">
                Uitloggen
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  )
}
