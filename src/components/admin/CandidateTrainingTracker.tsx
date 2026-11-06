'use client'

/**
 * CandidateTrainingTracker.tsx
 * WAT:    Trainingen-tab op de sollicitatie: trainingen uit de catalogus aan de kandidaat koppelen
 *         en per gekoppelde training de status en score bijhouden.
 * WAAROM: `setCandidateTrainingProgress` en de trainingen-catalogus bestonden al, maar er was geen
 *         scherm om een training daadwerkelijk aan een kandidaat te koppelen — alleen een
 *         (alleen-lezen) overzicht in /admin/trainings.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { removeCandidateTraining, setCandidateTrainingProgress } from '@/services/trainings'
import { cn, formatDate } from '@/lib/utils'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

type ProgressRow = CandidateTrainingProgressRow & { training: Training }

export function CandidateTrainingTracker({
  applicationId,
  catalog,
  progress,
}: {
  applicationId: string
  catalog: Training[]
  progress: ProgressRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pickedTrainingId, setPickedTrainingId] = useState('')

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !assignedIds.has(t.id))

  function attach() {
    if (!pickedTrainingId) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, pickedTrainingId, 'not_started')
      setPickedTrainingId('')
      router.refresh()
    })
  }

  function changeStatus(trainingId: string, status: TrainingProgressStatus, currentScore: string | null) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, currentScore ? Number(currentScore) : undefined)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function remove(trainingId: string) {
    startTransition(async () => {
      await removeCandidateTraining(applicationId, trainingId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && (
        <p className="text-sm text-muted-foreground">Nog geen trainingen aan deze kandidaat gekoppeld.</p>
      )}

      <ul className="space-y-2">
        {progress.map((p) => (
          <li key={p.trainingId} className="rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{p.training.title}</p>
                {p.training.standard && <p className="text-xs text-muted-foreground">{p.training.standard}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={p.status}
                  disabled={isPending}
                  onChange={(e) => changeStatus(p.trainingId, e.target.value as TrainingProgressStatus, p.score)}
                  className={cn(selectClasses)}
                >
                  {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ScoreField
                  disabled={isPending}
                  defaultScore={p.score}
                  onSave={(score) => saveScore(p.trainingId, p.status, score)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => remove(p.trainingId)}
                  title="Koppeling verwijderen"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            {(p.startedAt || p.completedAt) && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {p.startedAt && `Gestart: ${formatDate(p.startedAt)}`}
                {p.startedAt && p.completedAt && ' · '}
                {p.completedAt && `Voltooid: ${formatDate(p.completedAt)}`}
              </p>
            )}
          </li>
        ))}
      </ul>

      {available.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="training-pick">Training koppelen</Label>
            <select
              id="training-pick"
              value={pickedTrainingId}
              onChange={(e) => setPickedTrainingId(e.target.value)}
              className={cn(selectClasses, 'h-9 min-w-56')}
            >
              <option value="">Kies een training...</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" size="sm" disabled={isPending || !pickedTrainingId} onClick={attach}>
            Koppelen
          </Button>
        </div>
      )}
    </div>
  )
}

function ScoreField({
  defaultScore,
  disabled,
  onSave,
}: {
  defaultScore: string | null
  disabled: boolean
  onSave: (score: string) => void
}) {
  const [score, setScore] = useState(defaultScore ?? '')

  return (
    <Input
      type="number"
      step="0.1"
      placeholder="Score"
      value={score}
      disabled={disabled}
      onChange={(e) => setScore(e.target.value)}
      onBlur={() => {
        if (score !== (defaultScore ?? '')) onSave(score)
      }}
      className="h-8 w-20"
    />
  )
}
