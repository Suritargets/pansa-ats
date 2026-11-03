'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen toegewezen aan één sollicitatie: status cyclen, score vastleggen,
 *         en een nieuwe training uit de catalogus toewijzen.
 */

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, Trash2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { removeCandidateTraining, setCandidateTrainingProgress } from '@/services/trainings'
import { Button } from '@/components/ui/button'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const STATUS_ICON: Record<TrainingProgressStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: CircleDashed,
  completed: CheckCircle2,
  failed: XCircle,
}

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

export function CandidateTrainings({
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
  const selectRef = useRef<HTMLSelectElement>(null)

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !assignedIds.has(t.id))

  function cycleStatus(trainingId: string, current: TrainingProgressStatus) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, next)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus, value: string) {
    const trimmed = value.trim()
    const score = trimmed === '' ? null : Number(trimmed)
    if (score !== null && Number.isNaN(score)) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score)
      router.refresh()
    })
  }

  function assign() {
    const trainingId = selectRef.current?.value
    if (!trainingId) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, 'not_started')
      router.refresh()
      if (selectRef.current) selectRef.current.value = ''
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
      {progress.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen aan deze kandidaat.</p>
      ) : (
        <ul className="space-y-2">
          {progress.map((p) => {
            const Icon = STATUS_ICON[p.status]
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => cycleStatus(p.trainingId, p.status)}
                  className="flex flex-1 items-center gap-3 text-left text-sm"
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0',
                      p.status === 'completed' && 'text-primary',
                      p.status === 'failed' && 'text-destructive'
                    )}
                  />
                  <span className="flex-1 font-medium text-foreground">{p.training.title}</span>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[p.status]}</span>
                </button>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={p.score ?? ''}
                  disabled={isPending}
                  onBlur={(e) => saveScore(p.trainingId, p.status, e.currentTarget.value)}
                  placeholder="score"
                  aria-label={`Score voor ${p.training.title}`}
                  className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => remove(p.trainingId)}
                  aria-label={`${p.training.title} verwijderen`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            ref={selectRef}
            defaultValue=""
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="" disabled>
              Training kiezen…
            </option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={assign}>
            Toewijzen
          </Button>
        </div>
      )}
    </div>
  )
}
