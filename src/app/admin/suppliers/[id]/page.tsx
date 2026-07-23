import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getSupplierById } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { SupplierForm } from '@/components/admin/SupplierForm'

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { id } = await params
  const { saved } = await searchParams

  const supplier = await getSupplierById(id)
  if (!supplier) notFound()

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">{supplier.name}</h1>
      <SupplierForm supplier={supplier} saved={saved === '1'} />
    </AdminShell>
  )
}
