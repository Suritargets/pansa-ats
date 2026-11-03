'use client'

/**
 * TrainingProgress.tsx
 * WAT:    Trainingscatalogus met voortgang/score per kandidaat (application), analoog aan
 *         OnboardingChecklist: klik op de status-badge om te cyclen, score apart opslaan.
 */

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setCandidateTrainingProgress } from '@/services/trainings'
import { Input } from '@/components/ui/input'
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

export function TrainingProgress({
  applicationId,
  trainings,
  progress,
}: {
  applicationId: string
  trainings: Training[]
  progress: CandidateTrainingProgressRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const progressByTraining = new Map(progress.map((p) => [p.trainingId, p]))

  function cycle(trainingId: string, current: TrainingProgressStatus, score: string | null) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, next, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function saveScore(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  if (trainings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
  }

  return (
    <ul className="space-y-2">
      {trainings.map((training) => {
        const p = progressByTraining.get(training.id)
        const status = p?.status ?? 'not_started'
        const Icon = STATUS_ICON[status]
        return (
          <li key={training.id} className="rounded-lg border border-border px-3 py-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => cycle(training.id, status, p?.score ?? null)}
                className={cn(
                  'flex flex-1 items-center gap-3 text-left text-sm hover:opacity-80',
                  status === 'completed' && 'text-muted-foreground'
                )}
              >
                <Icon className={cn('size-4 shrink-0', status === 'completed' && 'text-primary')} />
                <span className="flex-1">
                  {training.title}
                  {training.standard && <span className="ml-2 text-xs text-muted-foreground">{training.standard}</span>}
                </span>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
              </button>
              <Input
                type="number"
                step="0.1"
                placeholder="Score"
                defaultValue={p?.score ?? ''}
                disabled={isPending}
                className="h-7 w-20 shrink-0 text-xs"
                onBlur={(e) => {
                  if (e.target.value !== (p?.score ?? '')) saveScore(training.id, status, e.target.value)
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
