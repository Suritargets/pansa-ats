/**
 * admin/candidates/import/page.tsx
 * WAT:    Bulk-import van kandidaten via CSV (staff).
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listCompanies, listJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { CandidateImportForm } from '@/components/admin/CandidateImportForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CandidateImportPage() {
  const session = await requireSession([...STAFF_ROLES])
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Kandidaten importeren</h1>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm">CSV-import</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidateImportForm companies={companies} jobCategories={jobCategories} />
        </CardContent>
      </Card>
    </AdminShell>
  )
}
