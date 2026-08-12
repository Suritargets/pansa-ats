'use client'

/**
 * TrainingTracker.tsx
 * WAT:    Trainingen (ASME/AWS/API e.d.) koppelen aan een sollicitatie en voortgang/score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_VARIANT: Record<TrainingProgressStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  not_started: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  failed: 'destructive',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingTracker({
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
  const [trainingId, setTrainingId] = useState(trainings[0]?.id ?? '')
  const [status, setStatus] = useState<TrainingProgressStatus>('not_started')
  const [score, setScore] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!trainingId) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      setScore('')
      router.refresh()
    })
  }

  if (trainings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus.</p>
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld aan deze kandidaat.</p>
      ) : (
        <ul className="space-y-2">
          {progress.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{p.training.title}</p>
                {p.training.standard && <p className="text-xs text-muted-foreground">{p.training.standard}</p>}
              </div>
              <div className="flex items-center gap-2">
                {p.score && <span className="text-xs text-muted-foreground">Score: {p.score}</span>}
                <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Training koppelen / voortgang bijwerken
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Training</Label>
            <select value={trainingId} onChange={(e) => setTrainingId(e.target.value)} className={cn(selectClasses)}>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)}
              className={cn(selectClasses)}
            >
              {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Score</Label>
            <Input type="number" step="0.01" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Bezig...' : 'Opslaan'}
        </Button>
      </form>
    </div>
  )
}
