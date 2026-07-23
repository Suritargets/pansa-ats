'use client'

/**
 * StatusFilter.tsx
 * WAT:    Statusfilter voor de sollicitatiepipeline — navigeert naar dezelfde pagina met
 *         ?status=..., behoudt overige query-params (bv. search).
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'

export function StatusFilter({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onChange(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (status) params.set('status', status)
    else params.delete('status')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      <option value="">Alle statussen</option>
      {(Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]).map(([statusValue, label]) => (
        <option key={statusValue} value={statusValue}>
          {label}
        </option>
      ))}
    </select>
  )
}
