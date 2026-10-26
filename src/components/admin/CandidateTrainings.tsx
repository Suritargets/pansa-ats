'use client'

/**
 * CandidateTrainings.tsx
 * WAT:    Trainingen toewijzen aan deze sollicitatie en voortgang/score per training bijhouden
 *         (ASME/AWS/API e.d.), zichtbaar op het Trainingen-tabblad.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'
import { cn } from '@/lib/utils'

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
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

type ProgressWithTraining = CandidateTrainingProgressRow & { training: Training }

function StatusSelect({ value, onChange }: { value: TrainingProgressStatus; onChange: (v: TrainingProgressStatus) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as TrainingProgressStatus)} className={cn(selectClasses)}>
      {(Object.entries(STATUS_LABELS) as [TrainingProgressStatus, string][]).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  )
}

function TrainingRow({
  row,
  disabled,
  onUpdate,
}: {
  row: ProgressWithTraining
  disabled: boolean
  onUpdate: (trainingId: string, status: TrainingProgressStatus, score: string) => void
}) {
  const [status, setStatus] = useState<TrainingProgressStatus>(row.status)
  const [score, setScore] = useState(row.score ?? '')
  const dirty = status !== row.status || score !== (row.score ?? '')

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="min-w-40 flex-1">
        <p className="font-medium text-foreground">{row.training.title}</p>
        {row.training.standard && <p className="text-xs text-muted-foreground">{row.training.standard}</p>}
      </div>
      <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABELS[row.status]}</Badge>
      <StatusSelect value={status} onChange={setStatus} />
      <Input className="h-8 w-20" type="number" step="0.01" placeholder="Score" value={score} onChange={(e) => setScore(e.target.value)} />
      <Button type="button" size="xs" variant="outline" disabled={disabled || !dirty} onClick={() => onUpdate(row.trainingId, status, score)}>
        Opslaan
      </Button>
    </li>
  )
}

export function CandidateTrainings({
  applicationId,
  catalog,
  progress,
}: {
  applicationId: string
  catalog: Training[]
  progress: ProgressWithTraining[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState('')
  const [newStatus, setNewStatus] = useState<TrainingProgressStatus>('not_started')
  const [newScore, setNewScore] = useState('')

  const attachedIds = new Set(progress.map((p) => p.trainingId))
  const available = catalog.filter((t) => !attachedIds.has(t.id))

  function save(trainingId: string, status: TrainingProgressStatus, score: string) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, trainingId, status, score ? Number(score) : undefined)
      router.refresh()
    })
  }

  function attach() {
    if (!selected) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selected, newStatus, newScore ? Number(newScore) : undefined)
      setSelected('')
      setNewStatus('not_started')
      setNewScore('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {progress.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen toegewezen.</p>
      ) : (
        <ul className="space-y-2">
          {progress.map((p) => (
            <TrainingRow key={p.id} row={p} disabled={isPending} onUpdate={save} />
          ))}
        </ul>
      )}

      {catalog.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen trainingen in de catalogus. Voeg ze toe via Trainingen in het menu.</p>
      ) : available.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label>Training toewijzen</Label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses, 'w-48')}>
              <option value="">Kies een training...</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <StatusSelect value={newStatus} onChange={setNewStatus} />
          </div>
          <div className="space-y-1.5">
            <Label>Score</Label>
            <Input className="h-8 w-20" type="number" step="0.01" value={newScore} onChange={(e) => setNewScore(e.target.value)} />
          </div>
          <Button type="button" size="sm" disabled={!selected || isPending} onClick={attach}>
            Toevoegen
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Alle trainingen uit de catalogus zijn al toegewezen.</p>
      )}
    </div>
  )
}
