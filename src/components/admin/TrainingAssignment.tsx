'use client'

/**
 * TrainingAssignment.tsx
 * WAT:    Trainingen toewijzen aan deze sollicitatie en per toegewezen training de status
 *         (en bij afronding het cijfer) bijhouden. Mirrort het cyclus-patroon van OnboardingChecklist.
 */

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

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

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

type AssignedTraining = CandidateTrainingProgressRow & { training: Training }

export function TrainingAssignment({
  applicationId,
  catalog,
  assigned,
}: {
  applicationId: string
  catalog: Training[]
  assigned: AssignedTraining[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const assignedIds = new Set(assigned.map((a) => a.trainingId))
  const available = catalog.filter((t) => !assignedIds.has(t.id))
  const selectRef = useRef<HTMLSelectElement>(null)

  function cycleStatus(row: AssignedTraining) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(row.status) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, next, row.score ? Number(row.score) : undefined)
      router.refresh()
    })
  }

  function updateScore(row: AssignedTraining, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, row.trainingId, row.status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function assignTraining() {
    const trainingId = selectRef.current?.value
    if (!trainingId) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, 'not_started')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>
      ) : (
        <ul className="space-y-2">
          {assigned.map((row) => {
            const Icon = STATUS_ICON[row.status]
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => cycleStatus(row)}
                  className={cn(
                    'flex flex-1 items-center gap-3 text-left',
                    row.status === 'completed' && 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', row.status === 'completed' && 'text-primary')} />
                  <span className="flex-1 text-foreground">{row.training.title}</span>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[row.status]}</span>
                </button>
                {(row.status === 'completed' || row.status === 'failed') && (
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Cijfer"
                    defaultValue={row.score ?? ''}
                    disabled={isPending}
                    onBlur={(e) => updateScore(row, e.target.value)}
                    className="h-8 w-24"
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <div className="min-w-48 flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Training toewijzen</label>
            <select ref={selectRef} defaultValue={available[0]?.id ?? ''} className={selectClasses}>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" size="sm" disabled={isPending} onClick={assignTraining}>
            Toewijzen
          </Button>
        </div>
      )}
    </div>
  )
}
