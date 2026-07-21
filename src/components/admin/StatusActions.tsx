'use client'

/**
 * StatusActions.tsx
 * WAT:    Knoppen om de sollicitatie-status te verzetten of af te wijzen.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateApplicationStatus } from '@/services/applications'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'

export function StatusActions({
  applicationId,
  currentStatus,
  nextStatus,
}: {
  applicationId: string
  currentStatus: ApplicationStatus
  nextStatus: ApplicationStatus | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function advance(target: ApplicationStatus) {
    setError(null)
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, currentStatus, target)
      if (!result.success) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {nextStatus && (
        <Button className="w-full" disabled={isPending} onClick={() => advance(nextStatus)}>
          Verzet naar &ldquo;{APPLICATION_STATUS_LABELS[nextStatus]}&rdquo;
        </Button>
      )}
      {currentStatus !== 'rejected' && currentStatus !== 'withdrawn' && (
        <Button variant="destructive" className="w-full" disabled={isPending} onClick={() => advance('rejected')}>
          Afwijzen
        </Button>
      )}
    </div>
  )
}
