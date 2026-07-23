import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listClients } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ClientsTable } from '@/components/admin/ClientsTable'
import { Button } from '@/components/ui/button'

export default async function ClientsPage() {
  const session = await requireSession([...STAFF_ROLES])
  const clients = await listClients()

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Clienten ({clients.length})</h1>
        <Button render={<Link href="/admin/clients/new" />}>Nieuwe client</Button>
      </div>
      <ClientsTable clients={clients} />
    </AdminShell>
  )
}
