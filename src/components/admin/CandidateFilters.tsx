'use client'

/**
 * CandidateFilters.tsx
 * WAT:    Filterbalk voor de kandidatenlijst (branche/niveau/functiecategorie) — navigeert
 *         naar dezelfde pagina met bijgewerkte query-params, zelfde patroon als StatusFilter.
 */

import { useRouter, useSearchParams } from 'next/navigation'
import type { JobBranche, JobCategory, JobLevel } from '@/types/database'

const BRANCHE_LABELS: Record<JobBranche, string> = {
  mining_operations: 'Mijnbouw operaties',
  technical_maintenance: 'Technisch onderhoud',
  trades: 'Vakmanschap',
  hospitality_camp: 'Camp/hospitality',
  administration_support: 'Administratie',
  security_safety: 'Beveiliging/veiligheid',
  logistics_warehouse: 'Logistiek/magazijn',
}

const LEVEL_LABELS: Record<JobLevel, string> = {
  helper: 'Helper',
  operator: 'Operator',
  skilled: 'Vakbekwaam',
  supervisor: 'Supervisor',
  administrative: 'Administratief',
}

const selectClasses =
  'h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function CandidateFilters({
  branche,
  level,
  jobCategoryId,
  jobCategories,
}: {
  branche: string
  level: string
  jobCategoryId: string
  jobCategories: JobCategory[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    const query = params.toString()
    router.push(query ? `/admin/candidates?${query}` : '/admin/candidates')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select value={branche} onChange={(e) => updateParam('branche', e.target.value)} className={selectClasses}>
        <option value="">Alle branches</option>
        {(Object.entries(BRANCHE_LABELS) as [JobBranche, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select value={level} onChange={(e) => updateParam('level', e.target.value)} className={selectClasses}>
        <option value="">Alle niveaus</option>
        {(Object.entries(LEVEL_LABELS) as [JobLevel, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        value={jobCategoryId}
        onChange={(e) => updateParam('jobCategoryId', e.target.value)}
        className={selectClasses}
      >
        <option value="">Alle functies</option>
        {jobCategories.map((jc) => (
          <option key={jc.id} value={jc.id}>
            {jc.name}
          </option>
        ))}
      </select>
    </div>
  )
}
