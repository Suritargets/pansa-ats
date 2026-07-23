/**
 * admin/settings/chat-kb/page.tsx
 * WAT:    Kennisbank voor de chat-widget — de AI gebruikt actieve items als context om
 *         bezoekersvragen te beantwoorden (eenvoudige keyword-RAG, geen vector-embeddings).
 */

import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listChatKbEntries } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ChatKbForm } from '@/components/admin/ChatKbForm'
import { ChatKbRowActions } from '@/components/admin/ChatKbRowActions'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function ChatKbSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const entries = await listChatKbEntries()

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Chat-kennisbank</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        De chatbot beantwoordt vragen van bezoekers automatisch in hun eigen taal (Nederlands, Engels, Sranantongo,
        Spaans, Portugees of vereenvoudigd Chinees), op basis van de actieve items hieronder.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    Nog geen kennisbank-items.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-foreground">{entry.topic}</TableCell>
                  <TableCell>
                    <Badge variant={entry.active ? 'default' : 'secondary'}>{entry.active ? 'Actief' : 'Inactief'}</Badge>
                  </TableCell>
                  <TableCell>
                    <ChatKbRowActions id={entry.id} active={entry.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ChatKbForm />
      </div>
    </AdminShell>
  )
}
