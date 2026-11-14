'use client'

/**
 * CandidateTrainingProgress.tsx
 * WAT:    Trainingen uit de catalogus koppelen aan deze sollicitatie en per training de
 *         status en score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

type ProgressRow = CandidateTrainingProgressRow & { training: Training }

export function CandidateTrainingProgress({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: ProgressRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newTrainingId, setNewTrainingId] = useState('')

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = trainings.filter((t) => !attachedIds.has(t.id))

  function save(trainingId: string, status: TrainingProgressStatus, score: string) {
    const parsedScore = score.trim() ? Number(score) : undefined
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, parsedScore)
      router.refresh()
    })
  }

  function attach() {
    if (!newTrainingId) return
    const trainingId = newTrainingId
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, 'not_started')
      setNewTrainingId('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>
      ) : (
        <ul className="space-y-2">
          {progress.map((row) => (
            <TrainingRow key={row.id} row={row} disabled={isPending} onSave={save} />
          ))}
        </ul>
      )}

      {trainings.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nog geen trainingen in de catalogus — voeg deze toe via{' '}
          <a href="/admin/trainings" className="underline">
            Trainingen
          </a>
          .
        </p>
      ) : (
        availableTrainings.length > 0 && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <select
              value={newTrainingId}
              onChange={(e) => setNewTrainingId(e.target.value)}
              disabled={isPending}
              className={cn(selectClasses, 'flex-1')}
            >
              <option value="">Training koppelen…</option>
              {availableTrainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.standard ? ` (${t.standard})` : ''}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" disabled={isPending || !newTrainingId} onClick={attach}>
              Koppelen
            </Button>
          </div>
        )
      )}
    </div>
  )
}

function TrainingRow({
  row,
  disabled,
  onSave,
}: {
  row: ProgressRow
  disabled: boolean
  onSave: (trainingId: string, status: TrainingProgressStatus, score: string) => void
}) {
  const [status, setStatus] = useState<TrainingProgressStatus>(row.status)
  const [score, setScore] = useState(row.score ?? '')
  const dirty = status !== row.status || score !== (row.score ?? '')

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{row.training.title}</p>
        {row.training.standard && <p className="text-xs text-muted-foreground">{row.training.standard}</p>}
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
        disabled={disabled}
        className={selectClasses}
      >
        {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.1"
        min="0"
        max="10"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        disabled={disabled}
        className="h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || !dirty}
        onClick={() => onSave(row.trainingId, status, score)}
      >
        Opslaan
      </Button>
    </li>
  )
}
