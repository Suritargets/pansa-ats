'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen toewijzen aan deze kandidaat en voortgang/score bijhouden, zichtbaar op de Trainingen-tab.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CircleSlash, Hourglass, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_ICON: Record<TrainingProgressStatus, typeof PlayCircle> = {
  not_started: PlayCircle,
  in_progress: Hourglass,
  completed: CheckCircle2,
  failed: CircleSlash,
}

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const scoreInputClasses =
  'h-7 w-24 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

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
  const [selected, setSelected] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const assignable = allTrainings.filter((t) => !assignedIds.has(t.id))

  function cycle(trainingId: string, current: TrainingProgressStatus, existingScore: string | null) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, next, existingScore ? Number(existingScore) : undefined)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus) {
    const raw = scoreDrafts[trainingId]
    const score = raw !== undefined && raw.trim() !== '' ? Number(raw) : undefined
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score)
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
    <div className="space-y-4">
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>}
      <ul className="space-y-2">
        {progress.map((p) => {
          const Icon = STATUS_ICON[p.status]
          return (
            <li key={p.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <button
                type="button"
                disabled={isPending}
                onClick={() => cycle(p.trainingId, p.status, p.score)}
                className="flex w-full items-center gap-3 text-left hover:text-foreground"
              >
                <Icon className={cn('size-4 shrink-0', p.status === 'completed' && 'text-primary')} />
                <span className="flex-1 font-medium text-foreground">{p.training.title}</span>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[p.status]}</span>
              </button>
              <div className="mt-2 flex items-center gap-2 pl-7">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Score"
                  defaultValue={p.score ?? ''}
                  onChange={(e) => setScoreDrafts((d) => ({ ...d, [p.trainingId]: e.target.value }))}
                  className={scoreInputClasses}
                />
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => saveScore(p.trainingId, p.status)}>
                  Score opslaan
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {assignable.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {assignable.map((t) => (
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
