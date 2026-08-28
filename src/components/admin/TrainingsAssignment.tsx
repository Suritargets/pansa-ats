'use client'

/**
 * TrainingsAssignment.tsx
 * WAT:    Trainingen (catalogus) koppelen aan deze kandidaat en status/score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const inputClasses =
  'h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingsAssignment({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  if (trainings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
  }

  const progressByTraining = new Map(progress.map((p) => [p.trainingId, p]))

  return (
    <ul className="space-y-2">
      {trainings.map((training) => (
        <TrainingRow key={training.id} applicationId={applicationId} training={training} progress={progressByTraining.get(training.id)} />
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

  const dirty = status !== (progress?.status ?? 'not_started') || score !== (progress?.score ?? '')

  function save() {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, training.id, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="flex-1">
        <p className="font-medium text-foreground">{training.title}</p>
        {training.standard && <p className="text-xs text-muted-foreground">{training.standard}</p>}
      </div>
      {!progress && <Badge variant="outline">Niet gekoppeld</Badge>}
      <select value={status} onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)} className={cn(selectClasses)}>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        max={100}
        step="0.1"
        placeholder="Score"
        value={score ?? ''}
        onChange={(e) => setScore(e.target.value)}
        className={cn(inputClasses)}
      />
      <Button size="sm" disabled={isPending || !dirty} onClick={save}>
        Opslaan
      </Button>
    </li>
  )
}
