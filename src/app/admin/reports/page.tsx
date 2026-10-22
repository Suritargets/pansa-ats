/**
 * admin/reports/page.tsx
 * WAT:    Rapportages: KPI-kaarten met trend, plaatsingen per maand, kandidaten per status, daaronder
 *         de conversie-funnel en gemiddelde doorlooptijd per fase (uit application_status_history).
 * WAAROM: Volgt het Pansa-rapportageontwerp. "Plaatsing" = een sollicitatie die de status "Actief
 *         geplaatst" bereikt; de plaatsingsratio is het deel van de sollicitaties met een aanbod dat
 *         uiteindelijk geplaatst werd.
 */

import { BarChart3, Download, Handshake, TrendingUp, UserPlus, Users } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getReportingStats, getReportsOverview } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { BarChart, DonutChart } from '@/components/admin/charts'
import { KpiCard } from '@/components/admin/KpiCard'
import { PageHero } from '@/components/admin/PageHero'
import { YearSelect } from '@/components/admin/YearSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_COLORS = {
  new: 'var(--status-new)',
  review: 'var(--status-review)',
  interview: 'var(--status-interview)',
  placed: 'var(--status-placed)',
  closed: 'var(--status-closed)',
} as const

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { year } = await searchParams
  const [overview, { funnel, avgTimeInStageDays }] = await Promise.all([
    getReportsOverview(year ? Number(year) : undefined),
    getReportingStats(),
  ])
  const { kpis } = overview

  const maxReached = Math.max(1, ...funnel.map((f) => f.reached))
  const totalPlacements = overview.placementsPerMonth.reduce((a, b) => a + b, 0)

  return (
    <AdminShell session={session}>
      <PageHero
        title="Rapportages"
        subtitle="Inzicht in prestaties en statistieken"
        image="nieuws"
        action={
          <div className="flex items-center gap-3">
            <YearSelect years={overview.years} value={overview.year} />
            <Button className="h-10 rounded-xl px-4" nativeButton={false} render={<a href="/api/export/general" download />}>
              <Download className="size-4" />
              Exporteren
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          value={kpis.candidates.value}
          label="Totaal kandidaten"
          trend={{ delta: kpis.candidates.deltaPct, unit: kpis.candidates.deltaUnit }}
          sparkline={kpis.candidates.series}
        />
        <KpiCard
          icon={UserPlus}
          value={kpis.placements.value}
          label="Nieuwe plaatsingen"
          trend={{ delta: kpis.placements.deltaPct, unit: kpis.placements.deltaUnit }}
          sparkline={kpis.placements.series}
        />
        <KpiCard
          icon={TrendingUp}
          value={`${kpis.placementRatio.value}%`}
          label="Plaatsingsratio"
          trend={{ delta: kpis.placementRatio.deltaPct, unit: kpis.placementRatio.deltaUnit }}
          sparkline={kpis.placementRatio.series}
        />
        <KpiCard
          icon={Handshake}
          value={kpis.activeClients.value}
          label="Actieve clients"
          trend={{ delta: kpis.activeClients.deltaPct, unit: kpis.activeClients.deltaUnit }}
          sparkline={kpis.activeClients.series}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <BarChart3 className="size-6 text-primary" />
              Plaatsingen per maand
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {overview.year} · {totalPlacements} totaal
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart labels={overview.monthLabels} values={overview.placementsPerMonth} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Kandidaten per status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 items-center">
            <DonutChart
              slices={overview.statusBreakdown.map((s) => ({ ...s, color: STATUS_COLORS[s.key] }))}
              totalLabel="sollicitaties"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Conversie-funnel</CardTitle>
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
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(stage.reached / maxReached) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Gemiddelde doorlooptijd per fase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avgTimeInStageDays.every((s) => s.sampleSize === 0) && (
              <p className="text-sm text-muted-foreground">Nog niet genoeg statuswijzigingen om een doorlooptijd te berekenen.</p>
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
