'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen koppelen aan een sollicitatie en status/score per training bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function CandidateTrainings({
  applicationId,
  allTrainings,
  progress,
}: {
  applicationId: string
  allTrainings: Training[]
  progress: ProgressRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const available = allTrainings.filter((t) => !attachedIds.has(t.id))
  const [selectedTrainingId, setSelectedTrainingId] = useState(available[0]?.id ?? '')

  function save(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
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
            <TrainingRow key={row.id} row={row} onSave={save} disabled={isPending} />
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4">
          <div className="min-w-48 flex-1 space-y-1.5">
            <Label htmlFor="training-select">Training koppelen</Label>
            <select
              id="training-select"
              className={cn(selectClasses, 'w-full')}
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
            >
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" disabled={isPending || !selectedTrainingId} onClick={() => save(selectedTrainingId, 'not_started', '')}>
            Koppelen
          </Button>
        </div>
      ) : (
        allTrainings.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nog geen trainingen in de catalogus — voeg er eerst een toe via Trainingen in het menu.
          </p>
        )
      )}
    </div>
  )
}

function TrainingRow({
  row,
  onSave,
  disabled,
}: {
  row: ProgressRow
  onSave: (trainingId: string, status: TrainingProgressStatus, score: string) => void
  disabled: boolean
}) {
  const [status, setStatus] = useState<TrainingProgressStatus>(row.status)
  const [score, setScore] = useState(row.score ?? '')

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-medium text-foreground">{row.training.title}</p>
        {row.training.standard && <p className="text-xs text-muted-foreground">{row.training.standard}</p>}
      </div>
      <select className={selectClasses} value={status} onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}>
        {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Input
        type="number"
        min={0}
        max={100}
        step="0.1"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="w-20"
      />
      <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => onSave(row.trainingId, status, score)}>
        Opslaan
      </Button>
    </li>
  )
}
