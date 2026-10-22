import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listCandidates, listJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { CandidatesTable } from '@/components/admin/CandidatesTable'
import { CandidateFilters } from '@/components/admin/CandidateFilters'
import { ListSearchBox } from '@/components/admin/ListSearchBox'
import { Button } from '@/components/ui/button'
import type { JobBranche, JobLevel } from '@/types/database'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ branche?: string; level?: string; jobCategoryId?: string; search?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { branche, level, jobCategoryId, search } = await searchParams

  const [candidates, jobCategories] = await Promise.all([
    listCandidates({
      branche: (branche as JobBranche) || undefined,
      level: (level as JobLevel) || undefined,
      jobCategoryId: jobCategoryId || undefined,
      search: search || undefined,
    }),
    listJobCategories(),
  ])

  return (
    <AdminShell session={session}>
      <PageHeader title="Kandidaten" subtitle="Beheer alle kandidaten in één overzicht" count={candidates.length}>
        <CandidateFilters
          branche={branche ?? ''}
          level={level ?? ''}
          jobCategoryId={jobCategoryId ?? ''}
          jobCategories={jobCategories}
        />
        <ListSearchBox placeholder="Zoek naar kandidaten..." />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/candidates/import" />}>
          <Upload className="size-4" />
          Importeren
        </Button>
        <Button nativeButton={false} render={<Link href="/admin/digitize" />}>
          <Plus className="size-4" />
          Nieuwe kandidaat
        </Button>
      </PageHeader>
      <CandidatesTable candidates={candidates} />
    </AdminShell>
  )
}
