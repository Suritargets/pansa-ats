'use client'

/**
 * ClientFeedbackForm.tsx
 * WAT:    Laat de klant feedback achterlaten op een met hen gedeelde kandidaat.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitClientFeedback } from '@/services/client'

export function ClientFeedbackForm({ applicationId, initialFeedback }: { applicationId: string; initialFeedback: string | null }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState(initialFeedback ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await submitClientFeedback(applicationId, feedback)
      if (!result.success) setError(result.error)
      else {
        setSaved(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Uw opmerkingen over deze kandidaat..."
        rows={4}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !error && <p className="text-sm text-muted-foreground">Feedback opgeslagen.</p>}
      <Button size="sm" disabled={isPending} onClick={save}>
        {isPending ? 'Bezig...' : 'Feedback opslaan'}
      </Button>
    </div>
  )
}
