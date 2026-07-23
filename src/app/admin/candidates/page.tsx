import Link from 'next/link'
import { Upload } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listCandidates, listJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { CandidatesTable } from '@/components/admin/CandidatesTable'
import { CandidateFilters } from '@/components/admin/CandidateFilters'
import { Button } from '@/components/ui/button'
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
        <div className="flex items-center gap-3">
          <CandidateFilters
            branche={branche ?? ''}
            level={level ?? ''}
            jobCategoryId={jobCategoryId ?? ''}
            jobCategories={jobCategories}
          />
          <Button variant="outline" size="sm" render={<Link href="/admin/candidates/import" />}>
            <Upload className="size-4" />
            Importeren
          </Button>
        </div>
      </div>
      <CandidatesTable candidates={candidates} />
    </AdminShell>
  )
}
