import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listSuppliers } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { SuppliersTable } from '@/components/admin/SuppliersTable'
import { Button } from '@/components/ui/button'

export default async function SuppliersPage() {
  const session = await requireSession([...STAFF_ROLES])
  const suppliers = await listSuppliers()

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Leverancier/Relatie ({suppliers.length})</h1>
        <Button render={<Link href="/admin/suppliers/new" />}>Nieuwe leverancier</Button>
      </div>
      <SuppliersTable suppliers={suppliers} />
    </AdminShell>
  )
}
