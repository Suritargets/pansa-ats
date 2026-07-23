import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { ClientForm } from '@/components/admin/ClientForm'

export default async function NewClientPage() {
  const session = await requireSession([...STAFF_ROLES])

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Nieuwe client</h1>
      <ClientForm />
    </AdminShell>
  )
}
