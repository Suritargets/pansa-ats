'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen koppelen aan deze sollicitatie en status/score bijhouden per training.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

const scoreInputClasses =
  'h-8 w-20 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function CandidateTrainings({
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

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const available = trainings.filter((t) => !attachedIds.has(t.id))

  function attach() {
    if (!selected) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selected, 'not_started')
      setSelected('')
      router.refresh()
    })
  }

  function cycleStatus(trainingId: string, current: TrainingProgressStatus) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, next)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus, value: string) {
    const trimmed = value.trim()
    const score = trimmed === '' ? undefined : Number(trimmed)
    if (trimmed !== '' && Number.isNaN(score)) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((p) => {
          const Icon = STATUS_ICON[p.status]
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <button
                type="button"
                disabled={isPending}
                onClick={() => cycleStatus(p.trainingId, p.status)}
                className={cn(
                  'flex flex-1 items-center gap-3 text-left hover:opacity-80',
                  p.status === 'completed' && 'text-muted-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    p.status === 'completed' && 'text-primary',
                    p.status === 'failed' && 'text-destructive'
                  )}
                />
                <span className="flex-1">
                  {p.training.title}
                  {p.training.standard && <span className="ml-1 text-xs text-muted-foreground">({p.training.standard})</span>}
                </span>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[p.status]}</span>
              </button>
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={p.score ?? ''}
                disabled={isPending}
                onBlur={(e) => saveScore(p.trainingId, p.status, e.target.value)}
                placeholder="Score"
                aria-label={`Score voor ${p.training.title}`}
                className={scoreInputClasses}
              />
            </li>
          )
        })}
      </ul>

      {available.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={attach}>
            Koppelen
          </Button>
        </div>
      )}
    </div>
  )
}
