'use client'

/**
 * StatusFilter.tsx
 * WAT:    Statusfilter voor het dashboard — navigeert naar dezelfde pagina met ?status=...
 */

import { useRouter } from 'next/navigation'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'

export function StatusFilter({ value }: { value: string }) {
  const router = useRouter()

  return (
    <select
      value={value}
      onChange={(e) => router.push(e.target.value ? `/admin/dashboard?status=${e.target.value}` : '/admin/dashboard')}
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
