'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { submitClientFeedback } from '@/services/client-portal'

export function ClientFeedbackForm({ applicationId, initialFeedback }: { applicationId: string; initialFeedback: string }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState(initialFeedback)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await submitClientFeedback(applicationId, feedback)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Uw feedback over deze kandidaat..." />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Bezig...' : 'Feedback opslaan'}
      </Button>
    </form>
  )
}
