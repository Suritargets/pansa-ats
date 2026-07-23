'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleChatKbEntryActive, deleteChatKbEntry } from '@/services/chat-kb'

export function ChatKbRowActions({ id, active }: { id: string; active: boolean }) {
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
            await toggleChatKbEntryActive(id, !active)
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
            if (!confirm('Kennisbank-item verwijderen?')) return
            await deleteChatKbEntry(id)
            router.refresh()
          })
        }
      >
        Verwijderen
      </Button>
    </div>
  )
}
