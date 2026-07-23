import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listVacancyRequests } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { VacancyRequestActions } from '@/components/admin/VacancyRequestActions'
import { Badge } from '@/components/ui/badge'
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

export default async function ClientRequestsAdminPage() {
  const session = await requireSession([...STAFF_ROLES])
  const requests = await listVacancyRequests()

  return (
    <AdminShell session={session}>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Vacature-aanvragen ({requests.length})</h1>
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
                <TableCell className="text-muted-foreground">{req.jobCategory?.name ?? '—'}</TableCell>
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
