'use client'

/**
 * TrainingsTab.tsx
 * WAT:    Trainingen uit de catalogus koppelen aan deze sollicitant, met status en score per training.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setCandidateTrainingProgress } from '@/services/trainings'
import { cn } from '@/lib/utils'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingsTab({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: CandidateTrainingProgressRow[]
}) {
  const progressByTraining = new Map(progress.map((p) => [p.trainingId, p]))

  if (trainings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
  }

  return (
    <ul className="space-y-3">
      {trainings.map((training) => (
        <TrainingRow
          key={training.id}
          applicationId={applicationId}
          training={training}
          existing={progressByTraining.get(training.id)}
        />
      ))}
    </ul>
  )
}

function TrainingRow({
  applicationId,
  training,
  existing,
}: {
  applicationId: string
  training: Training
  existing?: CandidateTrainingProgressRow
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<TrainingProgressStatus>(existing?.status ?? 'not_started')
  const [score, setScore] = useState(existing?.score ?? '')

  function save() {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, training.id, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{training.title}</p>
          {training.standard && <p className="text-xs text-muted-foreground">{training.standard}</p>}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
              className={cn(selectClasses, 'w-44')}
            >
              {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Score</Label>
            <Input
              type="number"
              step="0.1"
              value={score ?? ''}
              onChange={(e) => setScore(e.target.value)}
              className="w-24"
            />
          </div>
          <Button type="button" size="sm" disabled={isPending} onClick={save}>
            {isPending ? 'Bezig...' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </li>
  )
}
