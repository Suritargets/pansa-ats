/**
 * admin/settings/webhooks/page.tsx
 * WAT:    Beheer van uitgaande webhook-endpoints — alleen super_admin.
 */

import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listWebhookEndpoints } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { WebhookForm } from '@/components/admin/WebhookForm'
import { WebhookRowActions } from '@/components/admin/WebhookRowActions'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { WebhookEvent } from '@/types/database'

const EVENT_LABELS: Record<WebhookEvent, string> = {
  'application.created': 'Sollicitatie aangemaakt',
  'application.status_changed': 'Status gewijzigd',
  'vacancy_request.created': 'Vacature-aanvraag ontvangen',
}

export default async function WebhooksSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const webhooks = await listWebhookEndpoints()

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Webhooks</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Elk event wordt als JSON gePOSTed, ondertekend met HMAC-SHA256 in de header{' '}
        <code className="rounded bg-muted px-1">X-Pansa-Signature</code> (met het secret hieronder als sleutel).
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Secret</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nog geen webhooks.
                  </TableCell>
                </TableRow>
              )}
              {webhooks.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium text-foreground">{wh.name}</TableCell>
                  <TableCell className="max-w-40 truncate text-xs text-muted-foreground">{wh.url}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(wh.events as WebhookEvent[]).map((e) => EVENT_LABELS[e]).join(', ')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{wh.secret.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <Badge variant={wh.active ? 'default' : 'secondary'}>{wh.active ? 'Actief' : 'Inactief'}</Badge>
                  </TableCell>
                  <TableCell>
                    <WebhookRowActions id={wh.id} active={wh.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <WebhookForm />
      </div>
    </AdminShell>
  )
}
