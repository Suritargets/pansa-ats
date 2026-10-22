import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
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
      <PageHeader title="Clienten" subtitle="Beheer uw klanten en relaties" count={clients.length}>
        <ListSearchBox placeholder="Zoek naar bedrijven..." />
        <Button nativeButton={false} render={<Link href="/admin/clients/new" />}>
          <Plus className="size-4" />
          Nieuwe client
        </Button>
      </PageHeader>
      <ClientsTable clients={clients} />
    </AdminShell>
  )
}
