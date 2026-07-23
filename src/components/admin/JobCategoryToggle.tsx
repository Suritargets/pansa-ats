'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleJobCategoryActive } from '@/services/job-categories'

export function JobCategoryToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleJobCategoryActive(id, !active)
          router.refresh()
        })
      }
    >
      {active ? 'Deactiveren' : 'Activeren'}
    </Button>
  )
}
