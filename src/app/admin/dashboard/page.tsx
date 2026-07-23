/**
 * admin/dashboard/page.tsx
 * WAT:    KPI-overzicht voor staff. De sollicitatiepipeline zelf staat op /admin/applications.
 */

import { requireSession } from '@/lib/auth'
import { getDashboardStats } from '@/services/queries'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APPLICATION_STATUS_LABELS } from '@/types/database'

export default async function AdminDashboardPage() {
  const session = await requireSession([...STAFF_ROLES])
  const stats = await getDashboardStats()

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-xl font-bold text-foreground">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Totaal sollicitaties" value={stats.totalApplications} />
        <StatCard label="Actief geplaatst" value={stats.byStatus.active ?? 0} />
        <StatCard label="Clienten" value={stats.totalClients} />
        <StatCard label="Kandidaten" value={stats.totalCandidates} />
        <StatCard label="Openstaande vacature-aanvragen" value={stats.pendingVacancyRequests} />
        <StatCard label="Nieuw" value={stats.byStatus.new ?? 0} />
        <StatCard label="In beoordeling" value={stats.byStatus.in_review ?? 0} />
        <StatCard label="Onboarding" value={stats.byStatus.onboarding ?? 0} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Doel — geschiktheid nieuwe krachten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-semibold text-foreground">≥ 90%</p>
            <p className="text-sm text-muted-foreground">van de nieuwe krachten voldoet aan de gestelde eisen van de klant.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Doel — prestatie nieuwe krachten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-semibold text-foreground">≥ 90%</p>
            <p className="text-sm text-muted-foreground">van de beoordeelde nieuwe krachten presteert naar tevredenheid van de klant.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pipeline per status
        </h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(APPLICATION_STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{stats.byStatus[status as keyof typeof stats.byStatus] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-heading font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
