'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen toegewezen aan deze sollicitatie — status cyclen, score bijhouden,
 *         en een nieuwe training uit de catalogus toewijzen.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !assignedIds.has(t.id))

  function scoreFor(trainingId: string, stored: string | null): string {
    return scoreDrafts[trainingId] ?? stored ?? ''
  }

  function cycle(trainingId: string, current: TrainingProgressStatus, stored: string | null) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    const score = scoreFor(trainingId, stored)
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, next, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus) {
    const score = scoreDrafts[trainingId]
    if (score === undefined) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
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
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>}
      <ul className="space-y-2">
        {progress.map((p) => {
          const Icon = STATUS_ICON[p.status]
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <button
                type="button"
                disabled={isPending}
                onClick={() => cycle(p.trainingId, p.status, p.score)}
                className={cn(
                  'flex flex-1 items-center gap-3 text-left hover:text-foreground',
                  p.status === 'completed' && 'text-muted-foreground'
                )}
              >
                <Icon className={cn('size-4 shrink-0', p.status === 'completed' && 'text-primary')} />
                <span className="flex-1">
                  {p.training.title}
                  {p.training.standard && <span className="ml-1 text-xs text-muted-foreground">({p.training.standard})</span>}
                </span>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[p.status]}</span>
              </button>
              <Input
                type="number"
                step="0.1"
                placeholder="Score"
                className="h-8 w-20 shrink-0"
                disabled={isPending}
                value={scoreFor(p.trainingId, p.score)}
                onChange={(e) => setScoreDrafts((d) => ({ ...d, [p.trainingId]: e.target.value }))}
                onBlur={() => saveScore(p.trainingId, p.status)}
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
          <Button disabled={!selected || isPending} onClick={assign}>
            Toewijzen
          </Button>
        </div>
      )}
    </div>
  )
}
