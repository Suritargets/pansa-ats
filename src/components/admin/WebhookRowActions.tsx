'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleWebhookActive, deleteWebhookEndpoint } from '@/services/webhooks'

export function WebhookRowActions({ id, active }: { id: string; active: boolean }) {
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
            await toggleWebhookActive(id, !active)
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
            if (!confirm('Webhook verwijderen?')) return
            await deleteWebhookEndpoint(id)
            router.refresh()
          })
        }
      >
        Verwijderen
      </Button>
    </div>
  )
}
