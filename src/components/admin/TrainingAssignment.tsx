'use client'

/**
 * TrainingAssignment.tsx
 * WAT:    Trainingen toewijzen aan deze kandidaat en voortgang/score bijhouden, zichtbaar op de Trainingen-tab.
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

const inputClasses =
  'h-8 w-20 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingAssignment({
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
  const [selected, setSelected] = useState('')

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !assignedIds.has(t.id))

  function update(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      const parsedScore = score.trim() === '' ? undefined : Number(score)
      await setCandidateTrainingProgress(applicationId, trainingId, status, parsedScore)
      router.refresh()
    })
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
    <div className="space-y-3">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>}
      <ul className="space-y-2">
        {progress.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span className="flex-1 font-medium text-foreground">{p.training.title}</span>
            <select
              defaultValue={p.status}
              disabled={isPending}
              onChange={(e) => update(p.trainingId, e.target.value as TrainingProgressStatus, p.score ?? '')}
              className={selectClasses}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="score"
              defaultValue={p.score ?? ''}
              disabled={isPending}
              onBlur={(e) => update(p.trainingId, p.status, e.target.value)}
              className={inputClasses}
            />
          </li>
        ))}
      </ul>
      {available.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses, 'flex-1')}>
            <option value="">Kies een training...</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={assign}>
            Toewijzen
          </Button>
        </div>
      )}
    </div>
  )
}
