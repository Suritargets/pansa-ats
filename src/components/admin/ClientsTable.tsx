import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Client } from '@/types/database'

const STATUS_LABELS: Record<Client['status'], string> = {
  prospect: 'Prospect',
  active: 'Actief',
  inactive: 'Inactief',
}

const STATUS_CLASSES: Record<Client['status'], string> = {
  prospect: 'bg-[#f8cc39]/25 text-[#7a5d00]',
  active: 'bg-[#1c9848]/12 text-[#146d34]',
  inactive: 'bg-muted text-muted-foreground',
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8">
      <Table>
        <TableHeader>
          <TableRow className="text-xs tracking-wider uppercase">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Bedrijfsnaam</TableHead>
            <TableHead>Contactpersoon</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Locatie</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Geen clienten gevonden.
              </TableCell>
            </TableRow>
          )}
          {clients.map((client, i) => (
            <TableRow key={client.id}>
              <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
              <TableCell>
                <Link href={`/admin/clients/${client.id}`} className="font-medium text-foreground hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.contactName || '—'}
                {client.contactEmail && <span className="block text-xs">{client.contactEmail}</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{client.industry || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{client.address || '—'}</TableCell>
              <TableCell>
                <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold', STATUS_CLASSES[client.status])}>
                  {STATUS_LABELS[client.status]}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex gap-1">
                  <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/admin/clients/${client.id}`} aria-label={`${client.name} bekijken`} />}>
                    <Eye className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/admin/clients/${client.id}`} aria-label={`${client.name} bewerken`} />}>
                    <Pencil className="size-4" />
                  </Button>
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
