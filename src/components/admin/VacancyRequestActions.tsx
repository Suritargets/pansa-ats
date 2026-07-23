'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateVacancyRequestStatus } from '@/services/client-portal'
import type { VacancyRequestStatus } from '@/types/database'

export function VacancyRequestActions({ requestId, status }: { requestId: string; status: VacancyRequestStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function set(next: VacancyRequestStatus) {
    startTransition(async () => {
      await updateVacancyRequestStatus(requestId, next)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      {status !== 'approved' && (
        <Button variant="secondary" disabled={isPending} onClick={() => set('approved')}>
          Goedkeuren
        </Button>
      )}
      {status !== 'fulfilled' && (
        <Button variant="secondary" disabled={isPending} onClick={() => set('fulfilled')}>
          Vervuld
        </Button>
      )}
      {status !== 'rejected' && (
        <Button variant="destructive" disabled={isPending} onClick={() => set('rejected')}>
          Afwijzen
        </Button>
      )}
    </div>
  )
}
