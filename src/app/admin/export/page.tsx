import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function GeneralExportPage() {
  const session = await requireSession([...STAFF_ROLES])

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Algemene export</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-sm">Alle sollicitaties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exporteert alle sollicitaties met kandidaat-, bedrijfs- en statusgegevens als CSV.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download endpoint, not a page navigation */}
          <Button render={<a href="/api/export/general" />}>Downloaden (CSV)</Button>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
