'use client'

/**
 * InterviewForm.tsx
 * WAT:    Interview-scorecard — vragen komen uit de beheerbare vragenbank
 *         (`/admin/settings/interview-questions`, zie `interview_questions`), niet meer
 *         hardcoded. "Algemeen" is gescoord (1-5 per vraag), "werkervaring" is open.
 *         Andere types (client/medisch/tweede gesprek) hebben alleen vrije notities.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { addInterview, type InterviewQuestionAnswer } from '@/services/interviews'
import type { InterviewQuestion, InterviewType } from '@/types/database'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<InterviewType, string> = {
  general: 'Algemeen gesprek (gescoord)',
  work_experience: 'Werkervaring-gesprek',
  client: 'Klantgesprek',
  medical: 'Medische keuring',
  second_terms: 'Tweede gesprek — arbeidsvoorwaarden',
}

const selectClasses =
  'h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function InterviewForm({ applicationId, questions }: { applicationId: string; questions: InterviewQuestion[] }) {
  const router = useRouter()
  const [type, setType] = useState<InterviewType>('general')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [scores, setScores] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeQuestions = questions.filter((q) => q.type === type)

  function submit(e: React.FormEvent) {
    e.preventDefault()

    const payload: InterviewQuestionAnswer[] = activeQuestions.map((q) => ({
      category: q.category ?? q.text,
      question: q.category ? q.text : undefined,
      answer: answers[q.id] ?? '',
      score: q.scored ? Number(scores[q.id] ?? 0) || undefined : undefined,
    }))

    startTransition(async () => {
      await addInterview(applicationId, { type, questions: payload, notes })
      setAnswers({})
      setScores({})
      setNotes('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="space-y-1.5">
        <Label htmlFor="interview-type">Type interview</Label>
        <select
          id="interview-type"
          value={type}
          onChange={(e) => setType(e.target.value as InterviewType)}
          className={cn(selectClasses)}
        >
          {(Object.entries(TYPE_LABELS) as [InterviewType, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {activeQuestions.length > 0 && (
        <div className="space-y-3">
          {activeQuestions.map((q) => (
            <div key={q.id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{q.category ? `${q.category} — ${q.text}` : q.text}</Label>
                <Textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  className="min-h-16"
                />
              </div>
              {q.scored && (
                <div className="space-y-1 sm:w-20">
                  <Label className="text-xs text-muted-foreground">Score (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={scores[q.id] ?? ''}
                    onChange={(e) => setScores((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {activeQuestions.length === 0 && (type === 'general' || type === 'work_experience') && (
        <p className="text-sm text-muted-foreground">
          Geen actieve vragen voor dit type — beheer de vragenbank via Instellingen &gt; Interviewvragen.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="interview-notes">Notities</Label>
        <Textarea id="interview-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Bezig...' : 'Interview opslaan'}
      </Button>
    </form>
  )
}
