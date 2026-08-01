'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen koppelen aan een sollicitatie en voortgang/score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

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
  allTrainings,
  progress,
}: {
  applicationId: string
  allTrainings: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState('')

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = allTrainings.filter((t) => !attachedIds.has(t.id))

  function scoreFor(row: CandidateTrainingProgressRow) {
    return scoreDrafts[row.trainingId] ?? row.score ?? ''
  }

  function cycleStatus(row: CandidateTrainingProgressRow) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(row.status) + 1) % STATUS_ORDER.length]
    const score = scoreFor(row)
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, next, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function saveScore(row: CandidateTrainingProgressRow) {
    const score = scoreFor(row)
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, row.status, score ? Number(score) : undefined)
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
            <li key={row.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => cycleStatus(row)}
                  className={cn(
                    'flex flex-1 items-center gap-3 text-left text-sm',
                    row.status === 'completed' && 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', row.status === 'completed' && 'text-primary')} />
                  <span className="flex-1">
                    {row.training.title}
                    {row.training.standard && <span className="text-xs text-muted-foreground"> — {row.training.standard}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[row.status]}</span>
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 pl-7">
                <Input
                  type="number"
                  placeholder="Score"
                  className="h-7 w-24"
                  value={scoreFor(row)}
                  onChange={(e) => setScoreDrafts((prev) => ({ ...prev, [row.trainingId]: e.target.value }))}
                />
                <Button variant="ghost" size="sm" disabled={isPending} onClick={() => saveScore(row)}>
                  Score opslaan
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {availableTrainings.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {availableTrainings.map((training) => (
              <option key={training.id} value={training.id}>
                {training.title}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={attach}>
            Koppelen
          </Button>
        </div>
      )}
      {availableTrainings.length === 0 && allTrainings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nog geen trainingen in de catalogus. Voeg deze eerst toe via{' '}
          <a href="/admin/trainings" className="underline">
            Trainingen
          </a>
          .
        </p>
      )}
    </div>
  )
}
