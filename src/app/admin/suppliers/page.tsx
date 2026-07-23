import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listSuppliers } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { SuppliersTable } from '@/components/admin/SuppliersTable'
import { ListSearchBox } from '@/components/admin/ListSearchBox'
import { Button } from '@/components/ui/button'

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { search } = await searchParams
  const suppliers = await listSuppliers(search)

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Leverancier/Relatie ({suppliers.length})</h1>
        <div className="flex items-center gap-3">
          <ListSearchBox placeholder="Zoek op naam..." />
          <Button render={<Link href="/admin/suppliers/new" />}>Nieuwe leverancier</Button>
        </div>
      </div>
      <SuppliersTable suppliers={suppliers} />
    </AdminShell>
  )
}
