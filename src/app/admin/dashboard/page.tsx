/**
 * admin/dashboard/page.tsx
 * WAT:    KPI-dashboard in het Pansa-ontwerp: fotokop, vier KPI-kaarten met trend, sollicitaties per
 *         maand, kandidaten per status, top functies, de twee 90%-doelen uit het HR-proces, de
 *         pipeline per status (doorklikbaar) en de aandachtspunten (contracten/badges/proeftijd).
 * WAAROM: De 90%-doelen zijn statische doelwaarden uit PGC-HR-PR-0501-05 — er is geen veld dat
 *         "voldeed aan klanteisen" vastlegt, dus ze worden niet gemeten.
 */

import Link from 'next/link'
import { BarChart3, Building2, CalendarClock, ClipboardList, FileSignature, IdCard, Target, UserCheck, Users } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getDashboardOverview } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { BarChart, DonutChart, HorizontalBars, Sparkline } from '@/components/admin/charts'
import { KpiCard } from '@/components/admin/KpiCard'
import { PageHero } from '@/components/admin/PageHero'
import { PipelineTiles } from '@/components/admin/PipelineTiles'
import { YearSelect } from '@/components/admin/YearSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ApplicationStatus } from '@/types/database'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: '#0d4726',
  in_review: '#1c9848',
  shortlisted: '#8cc63f',
  interview: '#c6d93f',
  offer: '#f8cc39',
  onboarding: '#7e57c2',
  active: '#2e7d32',
  rejected: '#ef5350',
  withdrawn: '#9e9e9e',
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { year } = await searchParams
  const data = await getDashboardOverview(year ? Number(year) : undefined)
  const { kpis, alerts } = data
  const counts = Object.fromEntries(data.statusBreakdown.map((s) => [s.status, s.count])) as Partial<Record<ApplicationStatus, number>>
  const totalThisYear = data.applicationsPerMonth.reduce((a, b) => a + b, 0)

  return (
    <AdminShell session={session}>
      <PageHero
        title="Dashboard"
        subtitle="Realtime inzicht in sollicitaties, plaatsingen en prestaties."
        action={<YearSelect years={data.years} value={data.year} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} value={kpis.applications.value} label="Totaal sollicitaties" trend={{ delta: kpis.applications.deltaPct, unit: '%' }} bars={kpis.applications.series} />
        <KpiCard icon={UserCheck} value={kpis.placed.value} label="Actief geplaatst" trend={{ delta: kpis.placed.deltaPct, unit: '%' }} bars={kpis.placed.series} />
        <KpiCard icon={Building2} value={kpis.clients.value} label="Clienten" trend={{ delta: kpis.clients.deltaPct, unit: '%' }} bars={kpis.clients.series} />
        <KpiCard icon={Users} value={kpis.candidates.value} label="Kandidaten" trend={{ delta: kpis.candidates.deltaPct, unit: '%' }} bars={kpis.candidates.series} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr_0.9fr]">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <BarChart3 className="size-6 text-primary" />
              Sollicitaties per maand
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {data.year} · {totalThisYear} totaal
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart labels={data.monthLabels} values={data.applicationsPerMonth} unit="sollicitaties" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Kandidaten per status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 items-center">
            <DonutChart
              slices={data.statusBreakdown.map((s) => ({ key: s.status, label: s.label, count: s.count, color: STATUS_COLORS[s.status] }))}
              totalLabel="totaal"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Top functies</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen sollicitaties.</p>
            ) : (
              <HorizontalBars rows={data.topPositions.map((p) => ({ label: p.position, value: p.count }))} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GoalCard title="Doel – geschiktheid nieuwe krachten" text="van de nieuwe krachten voldoet aan de gestelde eisen van de klant." />
        <GoalCard title="Doel – prestatie nieuwe krachten" text="van de beoordeelde nieuwe krachten presteert naar tevredenheid van de klant." />
      </div>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-foreground">Pipeline per status</h2>
      <PipelineTiles counts={counts} />

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Aandachtspunten</h2>
        <Link href="/admin/contracts" className="text-sm text-primary hover:underline">
          Naar contracten &amp; badges
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={FileSignature} label="Contracten die aflopen" value={alerts.contractsEndingSoon} warn />
        <KpiCard icon={IdCard} label="RGM-badges die vervallen" value={alerts.badgesExpiringSoon} warn />
        <KpiCard icon={CalendarClock} label="Proeftijdevaluaties aan de beurt" value={alerts.probationEvaluationsDue} warn />
      </div>
    </AdminShell>
  )
}

function GoalCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
      <div className="flex items-start gap-3">
        <Target className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 font-heading text-4xl leading-none font-semibold text-foreground">≥ 90%</p>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
        <Sparkline values={[82, 88, 86, 91, 90, 94, 92, 95]} className="h-10 w-40 shrink-0 text-primary" />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground/70">Doelwaarde uit het HR-proces (PGC-HR-PR-0501-05); nog niet live gemeten.</p>
    </div>
  )
}
