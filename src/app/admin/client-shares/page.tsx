import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listAllShares } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default async function ClientSharesPage() {
  const session = await requireSession([...STAFF_ROLES])
  const shares = await listAllShares()

  return (
    <AdminShell session={session}>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Gedeelde profielen ({shares.length})</h1>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kandidaat</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Gedeeld op</TableHead>
              <TableHead>Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shares.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Nog geen profielen gedeeld.
                </TableCell>
              </TableRow>
            )}
            {shares.map((share) => (
              <TableRow key={share.id}>
                <TableCell>
                  <Link href={`/admin/applications/${share.applicationId}`} className="font-medium text-foreground hover:underline">
                    {share.application.candidate.firstName} {share.application.candidate.lastName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{share.client.name}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(share.sharedAt)}</TableCell>
                <TableCell className="text-muted-foreground">{share.clientFeedback || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
