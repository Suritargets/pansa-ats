import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { SupplierForm } from '@/components/admin/SupplierForm'

export default async function NewSupplierPage() {
  const session = await requireSession([...STAFF_ROLES])

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Nieuwe leverancier</h1>
      <SupplierForm />
    </AdminShell>
  )
}
