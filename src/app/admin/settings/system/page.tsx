/**
 * admin/settings/system/page.tsx
 * WAT:    Systeemstatus: instellingen, database-schema en datakwaliteit in één overzicht — alleen super_admin.
 */

import Link from 'next/link'
import { CheckCircle2, CircleAlert, TriangleAlert } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { runHealthChecks, type HealthCheck, type HealthStatus } from '@/lib/system-health'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

const ICON: Record<HealthStatus, React.ReactNode> = {
  ok: <CheckCircle2 className="size-5 text-[var(--color-brand-green)]" aria-label="In orde" />,
  warn: <TriangleAlert className="size-5 text-amber-500" aria-label="Aandacht nodig" />,
  error: <CircleAlert className="size-5 text-destructive" aria-label="Fout" />,
}

export default async function SystemPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const checks = await runHealthChecks()
  const groups = ['Instellingen', 'Database', 'Data'] as const
  const errors = checks.filter((c) => c.status === 'error').length
  const warns = checks.filter((c) => c.status === 'warn').length

  return (
    <AdminShell session={session}>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Systeemstatus</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {errors === 0 && warns === 0
          ? 'Alles in orde.'
          : `${errors} fout${errors === 1 ? '' : 'en'}, ${warns} waarschuwing${warns === 1 ? '' : 'en'}.`}
      </p>

      <div className="max-w-3xl space-y-6">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-2 text-sm font-semibold text-foreground">{group}</h2>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {checks
                .filter((c: HealthCheck) => c.group === group)
                .map((c) => (
                  <li key={c.key} className="flex items-start gap-3 p-3">
                    <span className="mt-0.5 shrink-0">{ICON[c.status]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{c.label}</p>
                      <p className="text-sm text-muted-foreground">{c.detail}</p>
                    </div>
                    {c.href && c.status !== 'ok' && (
                      <Link href={c.href} className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline">
                        Bekijken
                      </Link>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </AdminShell>
  )
}
