'use client'

/**
 * TrainingProgress.tsx
 * WAT:    Trainingen koppelen aan deze sollicitatie en status/score bijhouden, zichtbaar op de Trainingen-tab.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

export function TrainingProgress({
  applicationId,
  catalog,
  progress,
}: {
  applicationId: string
  catalog: Training[]
  progress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const assignedTrainingIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = catalog.filter((t) => !assignedTrainingIds.has(t.id))

  function scoreFor(trainingId: string, persisted: string | null) {
    return scores[trainingId] ?? persisted ?? ''
  }

  function save(trainingId: string, status: TrainingProgressStatus, persistedScore: string | null) {
    const score = scoreFor(trainingId, persistedScore)
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function cycleStatus(trainingId: string, current: TrainingProgressStatus, persistedScore: string | null) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    save(trainingId, next, persistedScore)
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
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-foreground">{p.training.title}</p>
              {p.training.standard && <p className="text-xs text-muted-foreground">{p.training.standard}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Score"
                className="h-8 w-20"
                disabled={isPending}
                value={scoreFor(p.trainingId, p.score)}
                onChange={(e) => setScores((s) => ({ ...s, [p.trainingId]: e.target.value }))}
                onBlur={() => save(p.trainingId, p.status, p.score)}
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() => cycleStatus(p.trainingId, p.status, p.score)}
              >
                <Badge variant="outline">{STATUS_LABELS[p.status]}</Badge>
              </button>
            </div>
          </li>
        ))}
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
          <Button disabled={!selected || isPending} onClick={assign}>
            Koppelen
          </Button>
        </div>
      )}
    </div>
  )
}
