/**
 * admin/settings/users/page.tsx
 * WAT:    Gebruikers- en rollenbeheer — alleen super_admin.
 */

import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listClients, listProfiles } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { UserForm } from '@/components/admin/UserForm'
import { UserRoleSelect } from '@/components/admin/UserRoleSelect'
import { UserActiveToggle } from '@/components/admin/UserActiveToggle'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default async function UsersSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const [profiles, clients] = await Promise.all([listProfiles(), listClients()])

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Gebruikers &amp; rollen ({profiles.length})</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sinds</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const isSelf = p.id === session.userId
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">
                      {p.fullName}
                      {isSelf && <span className="ml-1 text-xs text-muted-foreground">(jij)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>
                      <UserRoleSelect id={p.id} role={p.role} disabled={isSelf} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Actief' : 'Inactief'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    <TableCell>
                      <UserActiveToggle id={p.id} active={p.active} disabled={isSelf} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <UserForm clients={clients} />
      </div>
    </AdminShell>
  )
}
