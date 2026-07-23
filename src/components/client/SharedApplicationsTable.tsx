import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { SharedApplication } from '@/types/database'

export function SharedApplicationsTable({ applications }: { applications: SharedApplication[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kandidaat</TableHead>
            <TableHead>Functie</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gedeeld op</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                Nog geen profielen met u gedeeld.
              </TableCell>
            </TableRow>
          )}
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <Link href={`/client/applications/${app.id}`} className="font-medium text-foreground hover:underline">
                  {app.candidate.firstName} {app.candidate.lastName}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{app.positionApplied}</TableCell>
              <TableCell>
                <StatusBadge status={app.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(app.share.sharedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
