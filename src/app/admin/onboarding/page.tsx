import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listOnboardingOverview } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function OnboardingOverviewPage() {
  const session = await requireSession([...STAFF_ROLES])
  const rows = await listOnboardingOverview()

  return (
    <AdminShell session={session}>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Onboarding ({rows.length})</h1>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kandidaat</TableHead>
              <TableHead>Bedrijf</TableHead>
              <TableHead>Functie</TableHead>
              <TableHead>Voortgang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Geen kandidaten in onboarding.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link href={`/admin/applications/${row.id}`} className="font-medium text-foreground hover:underline">
                    {row.candidate.firstName} {row.candidate.lastName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.company.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.positionApplied}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.doneSteps} / {row.totalSteps} stappen voltooid
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
