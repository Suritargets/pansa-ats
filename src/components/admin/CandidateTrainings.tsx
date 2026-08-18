'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen koppelen aan deze sollicitatie en voortgang/score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressWithTraining, Training, TrainingProgressStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_OPTIONS: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const selectClasses =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function CandidateTrainings({
  applicationId,
  catalog,
  progress,
}: {
  applicationId: string
  catalog: Training[]
  progress: CandidateTrainingProgressWithTraining[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState('')

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !attachedIds.has(t.id))

  function attach() {
    if (!selected) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selected, 'not_started')
      setSelected('')
      router.refresh()
    })
  }

  function save(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      const parsed = score.trim() ? Number(score) : undefined
      await setCandidateTrainingProgress(applicationId, trainingId, status, parsed)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((p) => (
          <TrainingRow key={p.id} progress={p} disabled={isPending} onSave={(status, score) => save(p.trainingId, status, score)} />
        ))}
      </ul>

      {available.length > 0 ? (
        <div className="flex gap-2 pt-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses, 'flex-1')}>
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
      ) : (
        catalog.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nog geen trainingen in de catalogus — voeg er eerst een toe via Trainingen in het menu.
          </p>
        )
      )}
    </div>
  )
}

function TrainingRow({
  progress,
  disabled,
  onSave,
}: {
  progress: CandidateTrainingProgressWithTraining
  disabled: boolean
  onSave: (status: TrainingProgressStatus, score: string) => void
}) {
  const [status, setStatus] = useState<TrainingProgressStatus>(progress.status)
  const [score, setScore] = useState(progress.score ?? '')

  const dirty = status !== progress.status || score !== (progress.score ?? '')

  return (
    <li className="rounded-lg border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{progress.training.title}</p>
          {progress.training.standard && <p className="text-xs text-muted-foreground">{progress.training.standard}</p>}
        </div>
        <Badge variant="outline">{STATUS_LABELS[progress.status]}</Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)} className={selectClasses}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Input
          type="number"
          step="0.1"
          placeholder="Score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-24"
        />
        <Button size="sm" variant="secondary" disabled={disabled || !dirty} onClick={() => onSave(status, score)}>
          Bewaar
        </Button>
      </div>
    </li>
  )
}
