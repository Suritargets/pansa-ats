import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getClientById } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ClientForm } from '@/components/admin/ClientForm'

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { id } = await params
  const { saved } = await searchParams

  const client = await getClientById(id)
  if (!client) notFound()

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">{client.name}</h1>
      <ClientForm client={client} saved={saved === '1'} />
    </AdminShell>
  )
}
