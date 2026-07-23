'use client'

/**
 * TrainingProgress.tsx
 * WAT:    Trainingscatalogus met status/score per kandidaat, zichtbaar op de Trainingen-tab.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TrainingProgressStatus[]

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingProgress({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const progressByTraining = new Map(progress.map((p) => [p.trainingId, p]))

  if (trainings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
  }

  return (
    <ul className="space-y-2">
      {trainings.map((training) => (
        <TrainingRow
          key={training.id}
          applicationId={applicationId}
          training={training}
          current={progressByTraining.get(training.id)}
        />
      ))}
    </ul>
  )
}

function TrainingRow({
  applicationId,
  training,
  current,
}: {
  applicationId: string
  training: Training
  current?: CandidateTrainingProgressRow
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<TrainingProgressStatus>(current?.status ?? 'not_started')
  const [score, setScore] = useState(current?.score ?? '')

  function save() {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, training.id, status, score.trim() ? Number(score) : undefined)
      router.refresh()
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-medium text-foreground">{training.title}</p>
        {training.standard && <p className="text-xs text-muted-foreground">{training.standard}</p>}
      </div>
      {current && <Badge variant="outline">{STATUS_LABELS[current.status]}</Badge>}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
        className={cn(selectClasses)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.1"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className={cn(selectClasses, 'w-20')}
      />
      <Button size="sm" disabled={isPending} onClick={save}>
        Opslaan
      </Button>
    </li>
  )
}
