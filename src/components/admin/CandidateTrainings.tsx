'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen koppelen aan een sollicitatie en per training status + score bijhouden.
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
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [toAdd, setToAdd] = useState('')

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const availableToAdd = catalog.filter((t) => !attachedIds.has(t.id))

  function cycle(trainingId: string, current: TrainingProgressStatus, currentScore: string | null) {
    const order: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']
    const next = order[(order.indexOf(current) + 1) % order.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, next, currentScore ? Number(currentScore) : undefined)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus) {
    const draft = scoreDrafts[trainingId]
    if (draft === undefined) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, draft ? Number(draft) : undefined)
      router.refresh()
    })
  }

  function addTraining() {
    if (!toAdd) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, toAdd, 'not_started')
      setToAdd('')
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
            <li key={p.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => cycle(p.trainingId, p.status, p.score)}
                  className={cn(
                    'flex flex-1 items-center gap-3 text-left text-sm hover:opacity-80',
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
              </div>
              <div className="mt-2 flex items-center gap-2 pl-7">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Score"
                  defaultValue={p.score ?? ''}
                  onChange={(e) => setScoreDrafts((prev) => ({ ...prev, [p.trainingId]: e.target.value }))}
                  className="h-8 w-24"
                />
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => saveScore(p.trainingId, p.status)}>
                  Score opslaan
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {availableToAdd.length > 0 && (
        <div className="flex gap-2">
          <select value={toAdd} onChange={(e) => setToAdd(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {availableToAdd.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button disabled={!toAdd || isPending} onClick={addTraining}>
            Koppelen
          </Button>
        </div>
      )}
    </div>
  )
}
