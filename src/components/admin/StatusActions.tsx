'use client'

/**
 * StatusActions.tsx
 * WAT:    Knoppen om de sollicitatie-status te verzetten ("Volgende stap") of af te wijzen.
 *         `layout="inline"` zet ze naast elkaar in de kopkaart; `"stack"` onder elkaar in een paneel.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CircleX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateApplicationStatus } from '@/services/applications'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'
import { cn } from '@/lib/utils'

export function StatusActions({
  applicationId,
  currentStatus,
  nextStatus,
  layout = 'stack',
}: {
  applicationId: string
  currentStatus: ApplicationStatus
  nextStatus: ApplicationStatus | null
  layout?: 'stack' | 'inline'
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

  const inline = layout === 'inline'
  const closed = currentStatus === 'rejected' || currentStatus === 'withdrawn'

  return (
    <div className={cn(inline ? 'flex flex-wrap items-center gap-2' : 'space-y-2')}>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
      {nextStatus && (
        <Button className={cn(!inline && 'w-full')} disabled={isPending} onClick={() => advance(nextStatus)}>
          {inline ? 'Volgende stap' : `Verzet naar "${APPLICATION_STATUS_LABELS[nextStatus]}"`}
          <ArrowRight className="size-4" />
        </Button>
      )}
      {!closed && (
        <Button variant={inline ? 'outline' : 'destructive'} className={cn(!inline && 'w-full', inline && 'text-destructive')} disabled={isPending} onClick={() => advance('rejected')}>
          <CircleX className="size-4" />
          Afwijzen
        </Button>
      )}
      {inline && nextStatus && (
        <span className="text-xs text-muted-foreground">
          Volgende: {APPLICATION_STATUS_LABELS[nextStatus]}
        </span>
      )}
    </div>
  )
}
