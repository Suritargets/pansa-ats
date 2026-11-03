/**
 * admin/import/page.tsx
 * WAT:    Import data: kandidaten, klanten en leveranciers uit CSV of Excel (staff).
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { ImportWizard } from '@/components/admin/ImportWizard'

export default async function ImportPage() {
  const session = await requireSession([...STAFF_ROLES])

  return (
    <AdminShell session={session}>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Import data</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Haal kandidaten, klanten of leveranciers binnen uit CSV of Excel. Kolommen worden automatisch gekoppeld; rijen met fouten of dubbelen worden overgeslagen, nooit half geïmporteerd.
      </p>
      <ImportWizard />
    </AdminShell>
  )
}
