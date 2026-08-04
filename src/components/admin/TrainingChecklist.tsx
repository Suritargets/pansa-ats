'use client'

/**
 * TrainingChecklist.tsx
 * WAT:    Trainingscatalogus gekoppeld aan één sollicitatie: status en score per training bijwerken.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_OPTIONS: { value: TrainingProgressStatus; label: string }[] = [
  { value: 'not_started', label: 'Nog niet gestart' },
  { value: 'in_progress', label: 'Bezig' },
  { value: 'completed', label: 'Voltooid' },
  { value: 'failed', label: 'Niet gehaald' },
]

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingChecklist({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const progressByTraining = new Map(progress.map((p) => [p.trainingId, p]))

  return (
    <ul className="space-y-2">
      {trainings.map((training) => (
        <TrainingRow
          key={training.id}
          applicationId={applicationId}
          training={training}
          progress={progressByTraining.get(training.id)}
        />
      ))}
    </ul>
  )
}

function TrainingRow({
  applicationId,
  training,
  progress,
}: {
  applicationId: string
  training: Training
  progress?: CandidateTrainingProgressRow
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<TrainingProgressStatus>(progress?.status ?? 'not_started')
  const [score, setScore] = useState(progress?.score ?? '')

  function save() {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, training.id, status, score === '' ? undefined : Number(score))
      router.refresh()
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{training.title}</p>
        {training.standard && (
          <Badge variant="outline" className="mt-1">
            {training.standard}
          </Badge>
        )}
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
        className={cn(selectClasses)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Input
        type="number"
        step="0.01"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="h-8 w-24"
      />
      <Button size="sm" disabled={isPending} onClick={save}>
        Opslaan
      </Button>
    </li>
  )
}
