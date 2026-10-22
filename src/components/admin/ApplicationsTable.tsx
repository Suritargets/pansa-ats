/**
 * ApplicationsTable.tsx
 * WAT:    Tabel met sollicitaties voor het admin-dashboard.
 * WAAROM: Server component — rows komen al server-side uit Drizzle, geen client fetch nodig.
 */

import Link from 'next/link'
import { Eye, FileText } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Avatar } from '@/components/admin/Avatar'
import { formatDate } from '@/lib/utils'
import type { ApplicationWithCandidate } from '@/types/database'

export function ApplicationsTable({ applications }: { applications: ApplicationWithCandidate[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8">
      <Table>
        <TableHeader>
          <TableRow className="text-xs tracking-wider uppercase">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Kandidaat</TableHead>
            <TableHead>Functie</TableHead>
            <TableHead>Bedrijf</TableHead>
            <TableHead>Locatie</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                Geen sollicitaties gevonden.
              </TableCell>
            </TableRow>
          )}
          {applications.map((app, i) => {
            const name = `${app.candidate.firstName} ${app.candidate.lastName}`
            return (
              <TableRow key={app.id}>
                <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <Link href={`/admin/applications/${app.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar name={name} size="sm" />
                    <span>
                      <span className="block font-medium text-foreground">{name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {app.source === 'digitized_paper' ? 'Handgeschreven' : 'Online'}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-foreground">{app.positionApplied}</TableCell>
                <TableCell className="text-muted-foreground">{app.company.name}</TableCell>
                <TableCell className="text-muted-foreground">{app.candidate.residence || app.candidate.district || '—'}</TableCell>
                <TableCell>
                  <StatusBadge status={app.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(app.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex gap-1">
                    <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/admin/applications/${app.id}`} aria-label={`${name} bekijken`} />}>
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/admin/applications/${app.id}/cv`} target="_blank" aria-label={`CV van ${name}`} />}>
                      <FileText className="size-4" />
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
