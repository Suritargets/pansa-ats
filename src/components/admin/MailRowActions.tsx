'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { retryMailAction } from '@/services/mail-admin'

export function MailRowActions({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await retryMailAction(id)
            setError(result.error)
            router.refresh()
          })
        }
      >
        {isPending ? 'Bezig...' : 'Opnieuw proberen'}
      </Button>
      {error && <span className="max-w-48 text-right text-xs text-destructive">{error}</span>}
    </div>
  )
}
