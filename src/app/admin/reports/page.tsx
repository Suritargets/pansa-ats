/**
 * admin/reports/page.tsx
 * WAT:    Conversie-funnel (hoeveel sollicitaties bereikten elke fase) + gemiddelde
 *         doorlooptijd per fase, afgeleid uit application_status_history.
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getReportingStats } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReportsPage() {
  const session = await requireSession([...STAFF_ROLES])
  const { funnel, avgTimeInStageDays } = await getReportingStats()

  const maxReached = Math.max(1, ...funnel.map((f) => f.reached))

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-xl font-bold text-foreground">Rapportages</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversie-funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.length === 0 && <p className="text-sm text-muted-foreground">Nog geen statuswijzigingen geregistreerd.</p>}
            {funnel.map((stage, i) => {
              const prevReached = i > 0 ? funnel[i - 1].reached : stage.reached
              const conversion = prevReached > 0 ? Math.round((stage.reached / prevReached) * 100) : 100
              return (
                <div key={stage.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{stage.label}</span>
                    <span className="text-muted-foreground">
                      {stage.reached}
                      {i > 0 && <span className="ml-1.5 text-xs">({conversion}% van vorige fase)</span>}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(stage.reached / maxReached) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gemiddelde doorlooptijd per fase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avgTimeInStageDays.every((s) => s.sampleSize === 0) && (
              <p className="text-sm text-muted-foreground">
                Nog niet genoeg statuswijzigingen om een doorlooptijd te berekenen.
              </p>
            )}
            {avgTimeInStageDays
              .filter((s) => s.sampleSize > 0)
              .map((stage) => (
                <div key={stage.status} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <span className="text-foreground">{stage.label}</span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{stage.avgDays.toFixed(1)}</span> dagen
                    <span className="ml-1.5 text-xs">(n={stage.sampleSize})</span>
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
