'use client'

/**
 * TrainingAssign.tsx
 * WAT:    Trainingen koppelen aan deze sollicitatie en voortgang/score bijhouden,
 *         zichtbaar op de Trainingen-tab van het profielschets.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TrainingProgressStatus[]

export function TrainingAssign({
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

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = trainings.filter((t) => !assignedIds.has(t.id))

  const [newTrainingId, setNewTrainingId] = useState('')
  const [newStatus, setNewStatus] = useState<TrainingProgressStatus>('not_started')
  const [newScore, setNewScore] = useState('')

  function save(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function attach() {
    if (!newTrainingId) return
    save(newTrainingId, newStatus, newScore)
    setNewTrainingId('')
    setNewStatus('not_started')
    setNewScore('')
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((p) => (
          <TrainingRow key={p.id} progress={p} isPending={isPending} onSave={(status, score) => save(p.trainingId, status, score)} />
        ))}
      </ul>

      {availableTrainings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <select value={newTrainingId} onChange={(e) => setNewTrainingId(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {availableTrainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TrainingProgressStatus)}
            className={cn(selectClasses, 'flex-none w-40')}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Score"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            className="h-8 w-24"
          />
          <Button disabled={!newTrainingId || isPending} onClick={attach}>
            Koppelen
          </Button>
        </div>
      )}
    </div>
  )
}

function TrainingRow({
  progress,
  isPending,
  onSave,
}: {
  progress: CandidateTrainingProgressRow & { training: Training }
  isPending: boolean
  onSave: (status: TrainingProgressStatus, score: string) => void
}) {
  const [status, setStatus] = useState<TrainingProgressStatus>(progress.status)
  const [score, setScore] = useState(progress.score ?? '')

  const dirty = status !== progress.status || (score || '') !== (progress.score ?? '')

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <span className="flex-1 font-medium text-foreground">{progress.training.title}</span>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
        className={cn(selectClasses, 'flex-none w-40')}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <Input
        type="number"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="h-8 w-24"
      />
      <Button variant="secondary" disabled={!dirty || isPending} onClick={() => onSave(status, score)}>
        Opslaan
      </Button>
    </li>
  )
}
