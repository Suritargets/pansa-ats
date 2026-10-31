'use client'

/**
 * TrainingAssignment.tsx
 * WAT:    Trainingen koppelen aan deze sollicitatie en per training status + score bijhouden.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setCandidateTrainingProgress } from '@/services/trainings'
import { cn } from '@/lib/utils'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_ORDER = Object.keys(STATUS_LABELS) as TrainingProgressStatus[]

function TrainingRow({
  applicationId,
  training,
  progress,
}: {
  applicationId: string
  training: Training
  progress: CandidateTrainingProgressRow
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<TrainingProgressStatus>(progress.status)
  const [score, setScore] = useState(progress.score ?? '')
  const dirty = status !== progress.status || score !== (progress.score ?? '')

  function save() {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, training.id, status, score === '' ? undefined : Number(score))
      router.refresh()
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="min-w-32 flex-1">
        <p className="font-medium text-foreground">{training.title}</p>
        {training.standard && <p className="text-xs text-muted-foreground">{training.standard}</p>}
      </div>
      <select value={status} onChange={(e) => setStatus(e.target.value as TrainingProgressStatus)} className={cn(selectClasses, 'flex-none w-40')}>
        {STATUS_ORDER.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="w-20 flex-none"
      />
      <Button size="sm" disabled={!dirty || isPending} onClick={save}>
        Opslaan
      </Button>
    </li>
  )
}

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
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(progress.map((p) => p.trainingId))
  const unassigned = catalog.filter((t) => !assignedIds.has(t.id))

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
      {progress.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {progress.map((row) => (
          <TrainingRow key={row.id} applicationId={applicationId} training={row.training} progress={row} />
        ))}
      </ul>
      {unassigned.length > 0 ? (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {unassigned.map((training) => (
              <option key={training.id} value={training.id}>
                {training.title}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={assign}>
            Koppelen
          </Button>
        </div>
      ) : (
        catalog.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nog geen trainingen in de catalogus — voeg er een toe via Trainingen in het zijmenu.
          </p>
        )
      )}
    </div>
  )
}
