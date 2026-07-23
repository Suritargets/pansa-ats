'use client'

/**
 * InterviewForm.tsx
 * WAT:    Interview-scorecard — "algemeen" (15 vragen, elk 1-5 gescoord, van Vragenlijst
 *         sollicitatiegesprek) of "werkervaring" (12 open categorieën, van Vragenlijst job
 *         interview work experience). Andere types (client/medisch/tweede gesprek) alleen notities.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { addInterview, type InterviewQuestionAnswer } from '@/services/interviews'
import type { InterviewType } from '@/types/database'
import { cn } from '@/lib/utils'

const GENERAL_QUESTIONS = [
  'Vertel iets over jezelf',
  'Wat weet je over onze organisatie?',
  'Welke werkzaamheden spreken jou aan?',
  'Wat zijn jouw sterke punten?',
  'Wat zijn jouw verbeterpunten?',
  'Waar zie je jezelf over 1 jaar of 5 jaar, qua jouw werkzaamheden?',
  'Ben je proactief, creatief, innovatief en flexibel? Geef een voorbeeld.',
  'Waarom zouden we juist jou moeten aannemen?',
  "Met welke softwareprogramma's kan je werken? Geef voorbeelden.",
  'Heb je ooit gewerkt volgens standaarden, procedures en formulieren?',
  'Kan je in teamverband werken? Noem een voorbeeld.',
  'Hoe ga je om met deadlines en onregelmatige werkuren?',
  'Ben je een goed georganiseerd persoon? Geef voorbeelden.',
  'Ben je multi-inzetbaar? Welke werkzaamheden kan je nog meer uitvoeren?',
  'Welke bijdrage kan je leveren met jouw kennis, vaardigheden en werkattitude?',
]

const WORK_EXPERIENCE_CATEGORIES = [
  'Overzicht van de kerntaken',
  'Veiligheid',
  'Technische vakkennis — werkzaamheden',
  'Technische vakkennis — producten',
  'Technische vakkennis — opdrachten/instructies',
  'Materialenkennis',
  'Gereedschappenkennis',
  'Kennis van machines',
  'Kennis van tekenen (lezen/maken)',
  "Kennis van softwareprogramma's",
  'Kennis van ISO-standaarden/procedures',
  'Housekeeping, werkattitude en taalvaardigheid',
]

const TYPE_LABELS: Record<InterviewType, string> = {
  general: 'Algemeen gesprek (gescoord)',
  work_experience: 'Werkervaring-gesprek',
  client: 'Klantgesprek',
  medical: 'Medische keuring',
  second_terms: 'Tweede gesprek — arbeidsvoorwaarden',
}

const selectClasses =
  'h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function InterviewForm({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [type, setType] = useState<InterviewType>('general')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [scores, setScores] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const categories = type === 'general' ? GENERAL_QUESTIONS : type === 'work_experience' ? WORK_EXPERIENCE_CATEGORIES : []

  function submit(e: React.FormEvent) {
    e.preventDefault()

    const questions: InterviewQuestionAnswer[] = categories.map((category) => ({
      category,
      answer: answers[category] ?? '',
      score: type === 'general' ? Number(scores[category] ?? 0) || undefined : undefined,
    }))

    startTransition(async () => {
      await addInterview(applicationId, { type, questions, notes })
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

      {categories.length > 0 && (
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{category}</Label>
                <Textarea
                  value={answers[category] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [category]: e.target.value }))}
                  className="min-h-16"
                />
              </div>
              {type === 'general' && (
                <div className="space-y-1 sm:w-20">
                  <Label className="text-xs text-muted-foreground">Score (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={scores[category] ?? ''}
                    onChange={(e) => setScores((prev) => ({ ...prev, [category]: e.target.value }))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
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
