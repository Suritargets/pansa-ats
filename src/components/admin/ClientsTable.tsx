import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Client } from '@/types/database'

const STATUS_LABELS: Record<Client['status'], string> = {
  prospect: 'Prospect',
  active: 'Actief',
  inactive: 'Inactief',
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Contactpersoon</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                Geen clienten gevonden.
              </TableCell>
            </TableRow>
          )}
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link href={`/admin/clients/${client.id}`} className="font-medium text-foreground hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{client.industry || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{client.contactName || '—'}</TableCell>
              <TableCell>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {STATUS_LABELS[client.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
