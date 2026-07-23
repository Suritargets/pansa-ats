import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listClients } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ClientsTable } from '@/components/admin/ClientsTable'
import { ListSearchBox } from '@/components/admin/ListSearchBox'
import { Button } from '@/components/ui/button'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { search } = await searchParams
  const clients = await listClients(search)

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Clienten ({clients.length})</h1>
        <div className="flex items-center gap-3">
          <ListSearchBox placeholder="Zoek op naam..." />
          <Button render={<Link href="/admin/clients/new" />}>Nieuwe client</Button>
        </div>
      </div>
      <ClientsTable clients={clients} />
    </AdminShell>
  )
}
