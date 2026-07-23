'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleUserActive } from '@/services/users'

export function UserActiveToggle({ id, active, disabled }: { id: string; active: boolean; disabled?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending || disabled}
      onClick={() =>
        startTransition(async () => {
          await toggleUserActive(id, !active)
          router.refresh()
        })
      }
    >
      {active ? 'Deactiveren' : 'Activeren'}
    </Button>
  )
}
