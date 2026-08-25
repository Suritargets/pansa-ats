'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen koppelen aan deze sollicitatie en voortgang/score bijhouden,
 *         zichtbaar op de Trainingen-tab.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

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
  const [selectedTraining, setSelectedTraining] = useState('')

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = trainings.filter((t) => !attachedIds.has(t.id))

  function update(trainingId: string, status: TrainingProgressStatus, score?: number) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score)
      router.refresh()
    })
  }

  function attach() {
    if (!selectedTraining) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selectedTraining, 'not_started')
      setSelectedTraining('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((p) => (
          <TrainingRow
            key={p.id}
            progress={p}
            disabled={isPending}
            onUpdate={(status, score) => update(p.trainingId, status, score)}
          />
        ))}
      </ul>
      {availableTrainings.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={selectedTraining}
            onChange={(e) => setSelectedTraining(e.target.value)}
            className={selectClasses}
          >
            <option value="">Kies een training...</option>
            {availableTrainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button disabled={!selectedTraining || isPending} onClick={attach}>
            Koppelen
          </Button>
        </div>
      ) : (
        trainings.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nog geen trainingen in de catalogus. Voeg er eerst een toe via Trainingen in het menu.
          </p>
        )
      )}
    </div>
  )
}

function TrainingRow({
  progress,
  disabled,
  onUpdate,
}: {
  progress: CandidateTrainingProgressRow & { training: Training }
  disabled: boolean
  onUpdate: (status: TrainingProgressStatus, score?: number) => void
}) {
  const [status, setStatus] = useState<TrainingProgressStatus>(progress.status)
  const [score, setScore] = useState(progress.score ?? '')

  return (
    <li className="space-y-2 rounded-lg border border-border px-3 py-2 text-sm">
      <div>
        <span className="font-medium text-foreground">{progress.training.title}</span>
        {progress.training.standard && (
          <span className="ml-2 text-xs text-muted-foreground">({progress.training.standard})</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
          className={selectClasses}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input
          type="number"
          step="0.1"
          placeholder="Score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="h-8 w-24"
        />
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => onUpdate(status, score === '' ? undefined : Number(score))}
        >
          Bijwerken
        </Button>
      </div>
    </li>
  )
}
