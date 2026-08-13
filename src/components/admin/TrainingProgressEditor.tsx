'use client'

/**
 * TrainingProgressEditor.tsx
 * WAT:    Overzicht van de trainingscatalogus met per training de voortgang/score van
 *         deze kandidaat, bewerkbaar door staff.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setCandidateTrainingProgress } from '@/services/trainings'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingProgressEditor({
  applicationId,
  catalog,
  progress,
}: {
  applicationId: string
  catalog: Training[]
  progress: CandidateTrainingProgressRow[]
}) {
  const progressByTraining = new Map(progress.map((p) => [p.trainingId, p]))

  if (catalog.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
  }

  return (
    <ul className="space-y-2">
      {catalog.map((training) => (
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

  const dirty = status !== (current?.status ?? 'not_started') || score !== (current?.score ?? '')

  function save() {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, training.id, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-medium text-foreground">{training.title}</p>
        {training.standard && <p className="text-xs text-muted-foreground">{training.standard}</p>}
      </div>
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
        className={cn(selectClasses, 'w-40')}
      >
        {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([value, label]) => (
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
        disabled={isPending}
        onChange={(e) => setScore(e.target.value)}
        className="h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      <Button type="button" size="sm" variant="secondary" disabled={isPending || !dirty} onClick={save}>
        Opslaan
      </Button>
    </li>
  )
}
