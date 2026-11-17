'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteAiExample, toggleAiExample, promoteLogToExample } from '@/services/ai-training'

export function AiExampleActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleAiExample(id, !active)
            router.refresh()
          })
        }
      >
        {active ? 'Deactiveren' : 'Activeren'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            if (!confirm('Voorbeeldantwoord verwijderen?')) return
            await deleteAiExample(id)
            router.refresh()
          })
        }
      >
        Verwijderen
      </Button>
    </div>
  )
}

export function PromoteLogButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await promoteLogToExample(id)
          router.refresh()
        })
      }
    >
      Als voorbeeld opslaan
    </Button>
  )
}
