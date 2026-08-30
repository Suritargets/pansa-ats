'use client'

/**
 * TrainingChecklist.tsx
 * WAT:    Koppel trainingen (ASME/AWS/API e.d.) aan deze sollicitatie en volg voortgang/score.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setCandidateTrainingProgress } from '@/services/trainings'
import { cn } from '@/lib/utils'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_ICON: Record<TrainingProgressStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: CircleDashed,
  completed: CheckCircle2,
  failed: XCircle,
}

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingChecklist({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = trainings.filter((t) => !attachedIds.has(t.id))

  function scoreFor(row: CandidateTrainingProgressRow) {
    const draft = scoreDrafts[row.trainingId]
    if (draft !== undefined) return draft === '' ? undefined : Number(draft)
    return row.score ? Number(row.score) : undefined
  }

  function cycle(row: CandidateTrainingProgressRow) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(row.status) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, next, scoreFor(row))
      router.refresh()
    })
  }

  function saveScore(row: CandidateTrainingProgressRow) {
    if (scoreDrafts[row.trainingId] === undefined) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, row.status, scoreFor(row))
      router.refresh()
    })
  }

  function attach() {
    if (!selected) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selected, 'not_started')
      setSelected('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((row) => {
          const Icon = STATUS_ICON[row.status]
          return (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <button
                type="button"
                disabled={isPending}
                onClick={() => cycle(row)}
                className={cn(
                  'flex flex-1 items-center gap-3 text-left hover:text-foreground',
                  row.status === 'completed' && 'text-muted-foreground'
                )}
              >
                <Icon className={cn('size-4 shrink-0', row.status === 'completed' && 'text-primary')} />
                <span className="flex-1">
                  {row.training.title}
                  {row.training.standard && (
                    <span className="ml-1 text-xs text-muted-foreground">({row.training.standard})</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[row.status]}</span>
              </button>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Score"
                defaultValue={row.score ?? ''}
                disabled={isPending}
                onChange={(e) => setScoreDrafts((prev) => ({ ...prev, [row.trainingId]: e.target.value }))}
                onBlur={() => saveScore(row)}
                className="h-8 w-16 shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </li>
          )
        })}
      </ul>

      {availableTrainings.length > 0 ? (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {availableTrainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={attach}>
            Koppelen
          </Button>
        </div>
      ) : (
        trainings.length === 0 && (
          <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
        )
      )}
    </div>
  )
}
