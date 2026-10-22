/**
 * admin/onboarding/page.tsx
 * WAT:    Onboarding-overzicht: elke kandidaat in onboarding/actief met voortgangsbalk over de
 *         onboarding-stappen en een link naar het Onboarding-tabblad van de sollicitatie.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listOnboardingOverview } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { Avatar } from '@/components/admin/Avatar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default async function OnboardingOverviewPage() {
  const session = await requireSession([...STAFF_ROLES])
  const rows = await listOnboardingOverview()

  return (
    <AdminShell session={session}>
      <PageHeader title="Onboarding" subtitle="Beheer onboarding, contracten en trainingen" count={rows.length}>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/contracts" />}>
          Contracten &amp; badges
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/trainings" />}>
          Trainingen
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8">
        <Table>
          <TableHeader>
            <TableRow className="text-xs tracking-wider uppercase">
              <TableHead>Naam</TableHead>
              <TableHead>Functie</TableHead>
              <TableHead>Bedrijf</TableHead>
              <TableHead>Startdatum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-56">Voortgang</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Geen kandidaten in onboarding.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const name = `${row.candidate.firstName} ${row.candidate.lastName}`
              const pct = row.totalSteps > 0 ? Math.round((row.doneSteps / row.totalSteps) * 100) : 0
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/admin/applications/${row.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={name} size="sm" />
                      <span className="font-medium text-foreground">{name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground">{row.positionApplied}</TableCell>
                  <TableCell className="text-muted-foreground">{row.company.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-green),var(--color-brand-lime))]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground">{pct}%</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.doneSteps} van {row.totalSteps} stappen
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/admin/applications/${row.id}`} aria-label={`Onboarding van ${name} openen`} />}>
                      <ArrowRight className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
