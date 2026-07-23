/**
 * admin/settings/audit-log/page.tsx
 * WAT:    Audit-log viewer — laatste 200 events, filterbaar op action. Alleen super_admin.
 */

import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listAuditLog } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const { action } = await searchParams
  const events = await listAuditLog({ action: action || undefined })

  return (
    <AdminShell session={session}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Audit-log ({events.length})</h1>
        <form className="flex items-center gap-2">
          <Input name="action" defaultValue={action} placeholder="Filter op action (bv. login, application_status_changed)" className="w-80" />
          <Button type="submit" variant="outline" size="sm">Filteren</Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wanneer</TableHead>
              <TableHead>Wie</TableHead>
              <TableHead>Actie</TableHead>
              <TableHead>Entiteit</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  Geen events gevonden.
                </TableCell>
              </TableRow>
            )}
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(event.createdAt)}</TableCell>
                <TableCell className="text-foreground">{event.actorEmail ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{event.action}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {event.entityType ? `${event.entityType} · ${event.entityId ?? '—'}` : '—'}
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                  {event.metadata ? JSON.stringify(event.metadata) : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
