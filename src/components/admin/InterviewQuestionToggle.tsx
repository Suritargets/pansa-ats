'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleInterviewQuestionActive } from '@/services/interview-questions'

export function InterviewQuestionToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleInterviewQuestionActive(id, !active)
          router.refresh()
        })
      }
    >
      {active ? 'Deactiveren' : 'Activeren'}
    </Button>
  )
}
