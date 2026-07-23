import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listCandidates, listJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { CandidatesTable } from '@/components/admin/CandidatesTable'
import { CandidateFilters } from '@/components/admin/CandidateFilters'
import type { JobBranche, JobLevel } from '@/types/database'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ branche?: string; level?: string; jobCategoryId?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { branche, level, jobCategoryId } = await searchParams

  const [candidates, jobCategories] = await Promise.all([
    listCandidates({
      branche: (branche as JobBranche) || undefined,
      level: (level as JobLevel) || undefined,
      jobCategoryId: jobCategoryId || undefined,
    }),
    listJobCategories(),
  ])

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Kandidaten ({candidates.length})</h1>
        <CandidateFilters
          branche={branche ?? ''}
          level={level ?? ''}
          jobCategoryId={jobCategoryId ?? ''}
          jobCategories={jobCategories}
        />
      </div>
      <CandidatesTable candidates={candidates} />
    </AdminShell>
  )
}
