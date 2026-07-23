import Link from 'next/link'
import { Code2 } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES, SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listVacancyRequests } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { VacancyRequestActions } from '@/components/admin/VacancyRequestActions'
import { ListSearchBox } from '@/components/admin/ListSearchBox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { VacancyRequestStatus } from '@/types/database'

const STATUS_LABELS: Record<VacancyRequestStatus, string> = {
  submitted: 'Verstuurd',
  reviewing: 'In behandeling',
  approved: 'Goedgekeurd',
  fulfilled: 'Vervuld',
  rejected: 'Afgewezen',
}

export default async function ClientRequestsAdminPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { search } = await searchParams
  const requests = await listVacancyRequests(search)

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Vacature-aanvragen ({requests.length})</h1>
        <div className="flex items-center gap-3">
          <ListSearchBox placeholder="Zoek op client..." />
          {SUPER_ADMIN_ROLES.includes(session.role as (typeof SUPER_ADMIN_ROLES)[number]) && (
            <Button variant="outline" size="sm" render={<Link href="/admin/settings/embed" />}>
              <Code2 className="size-4" />
              Aanvraagformulier embedden
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Functie</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Actie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  Geen vacature-aanvragen.
                </TableCell>
              </TableRow>
            )}
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium text-foreground">{req.client.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {req.jobCategory?.name ?? '—'}
                  {req.jobScope.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {req.jobScope.map((entry, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{entry.category}:</span> {entry.requirement}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{req.quantity}</TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[req.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                <TableCell>
                  <VacancyRequestActions requestId={req.id} status={req.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
