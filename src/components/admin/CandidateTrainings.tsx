'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen die aan deze kandidaat/sollicitatie zijn gekoppeld: status + score
 *         bijwerken, en een nieuwe training uit de catalogus toewijzen.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_VARIANTS: Record<TrainingProgressStatus, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  not_started: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  failed: 'destructive',
}

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

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
  const [selectedTraining, setSelectedTraining] = useState('')
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({})

  const assignedTrainingIds = new Set(progress.map((p) => p.trainingId))
  const availableTrainings = allTrainings.filter((t) => !assignedTrainingIds.has(t.id))

  function cycleStatus(row: ProgressRow) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(row.status) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, next, row.score ? Number(row.score) : undefined)
      router.refresh()
    })
  }

  function saveScore(row: ProgressRow) {
    const raw = scoreDraft[row.trainingId]
    const score = raw === undefined || raw === '' ? undefined : Number(raw)
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, row.status, score)
      router.refresh()
    })
  }

  function assign() {
    if (!selectedTraining) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selectedTraining, 'not_started')
      setSelectedTraining('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>}
      <ul className="space-y-2">
        {progress.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{row.training.title}</p>
              {row.training.standard && <p className="text-xs text-muted-foreground">{row.training.standard}</p>}
            </div>
            <Input
              type="number"
              step="0.1"
              placeholder="Score"
              defaultValue={row.score ?? ''}
              onChange={(e) => setScoreDraft((prev) => ({ ...prev, [row.trainingId]: e.target.value }))}
              onBlur={() => scoreDraft[row.trainingId] !== undefined && saveScore(row)}
              className="h-8 w-20"
              disabled={isPending}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => cycleStatus(row)}
              className={cn('shrink-0', isPending && 'opacity-60')}
            >
              <Badge variant={STATUS_VARIANTS[row.status]}>{STATUS_LABELS[row.status]}</Badge>
            </button>
          </li>
        ))}
      </ul>

      {availableTrainings.length > 0 && (
        <div className="flex gap-2">
          <select value={selectedTraining} onChange={(e) => setSelectedTraining(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {availableTrainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button disabled={!selectedTraining || isPending} onClick={assign}>
            Toewijzen
          </Button>
        </div>
      )}
    </div>
  )
}
