'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen toewijzen aan deze sollicitatie en voortgang/score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setCandidateTrainingProgress } from '@/services/trainings'
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

export function CandidateTrainings({
  applicationId,
  catalog,
  progress,
}: {
  applicationId: string
  catalog: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !assignedIds.has(t.id))

  function scoreFor(row: CandidateTrainingProgressRow) {
    return scores[row.trainingId] ?? row.score ?? ''
  }

  function save(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function cycleStatus(row: CandidateTrainingProgressRow) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(row.status) + 1) % STATUS_ORDER.length]
    save(row.trainingId, next, scoreFor(row))
  }

  function assign() {
    if (!selected) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selected, 'not_started')
      setSelected('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>
      ) : (
        <ul className="space-y-2">
          {progress.map((row) => {
            const Icon = STATUS_ICON[row.status]
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => cycleStatus(row)}
                  className={cn(
                    'flex flex-1 items-center gap-2 text-left',
                    row.status === 'completed' && 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', row.status === 'completed' && 'text-primary')} />
                  <span className="flex-1">
                    {row.training.title}
                    {row.training.standard && <span className="text-xs text-muted-foreground"> ({row.training.standard})</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[row.status]}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Score"
                    value={scoreFor(row)}
                    onChange={(e) => setScores((s) => ({ ...s, [row.trainingId]: e.target.value }))}
                    className="h-8 w-20"
                  />
                  <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => save(row.trainingId, row.status, scoreFor(row))}
                  >
                    Opslaan
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {available.map((training) => (
              <option key={training.id} value={training.id}>
                {training.title}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={assign}>
            Toewijzen
          </Button>
        </div>
      )}
    </div>
  )
}
