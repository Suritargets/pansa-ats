import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listAllJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { JobCategoryForm } from '@/components/admin/JobCategoryForm'
import { JobCategoryToggle } from '@/components/admin/JobCategoryToggle'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function JobCategoriesSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const jobCategories = await listAllJobCategories()

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Functiecategorieën ({jobCategories.length})</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Branche</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobCategories.map((jc) => (
                <TableRow key={jc.id}>
                  <TableCell className="font-medium text-foreground">{jc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{jc.branche}</TableCell>
                  <TableCell className="text-muted-foreground">{jc.level}</TableCell>
                  <TableCell>
                    <Badge variant={jc.active ? 'default' : 'secondary'}>{jc.active ? 'Actief' : 'Inactief'}</Badge>
                  </TableCell>
                  <TableCell>
                    <JobCategoryToggle id={jc.id} active={jc.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <JobCategoryForm />
      </div>
    </AdminShell>
  )
}
