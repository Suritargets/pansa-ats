import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listPayrollBatches } from '@/services/queries'
import { createPayrollBatch } from '@/services/payroll'
import { AdminShell } from '@/components/admin/AdminShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default async function PayrollExportPage() {
  const session = await requireSession([...STAFF_ROLES])
  const batches = await listPayrollBatches()

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Payroll export</h1>
        <form action={createPayrollBatch}>
          <Button type="submit">Nieuwe batch (actief geplaatste kandidaten)</Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aangemaakt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Formaat</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Nog geen exportbatches.
                </TableCell>
              </TableRow>
            )}
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="text-muted-foreground">{formatDate(batch.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{batch.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground uppercase">{batch.fileFormat}</TableCell>
                <TableCell>
                  <Button variant="secondary" render={<a href={`/api/export/${batch.id}`} />}>
                    Downloaden
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
