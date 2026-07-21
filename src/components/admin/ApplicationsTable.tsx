/**
 * ApplicationsTable.tsx
 * WAT:    Tabel met sollicitaties voor het admin-dashboard.
 * WAAROM: Server component — rows komen al server-side uit Drizzle, geen client fetch nodig.
 */

import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { ApplicationWithCandidate } from '@/types/database'

export function ApplicationsTable({ applications }: { applications: ApplicationWithCandidate[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kandidaat</TableHead>
            <TableHead>Bedrijf</TableHead>
            <TableHead>Functie</TableHead>
            <TableHead>Bron</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                Geen sollicitaties gevonden.
              </TableCell>
            </TableRow>
          )}
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <Link href={`/admin/applications/${app.id}`} className="font-medium text-foreground hover:underline">
                  {app.candidate.firstName} {app.candidate.lastName}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{app.company.name}</TableCell>
              <TableCell className="text-muted-foreground">{app.positionApplied}</TableCell>
              <TableCell className="text-muted-foreground">
                {app.source === 'digitized_paper' ? 'Handgeschreven (gedigitaliseerd)' : 'Online formulier'}
              </TableCell>
              <TableCell>
                <StatusBadge status={app.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(app.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
