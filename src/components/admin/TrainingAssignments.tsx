'use client'

/**
 * TrainingAssignments.tsx
 * WAT:    Koppel trainingen uit de catalogus aan deze kandidaat en volg status/score,
 *         zichtbaar op de Trainingen-tab van de sollicitatie.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { setCandidateTrainingProgress } from '@/services/trainings'
import type { CandidateTrainingProgressRow, Training, TrainingProgressStatus } from '@/types/database'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

const STATUS_ORDER: TrainingProgressStatus[] = ['not_started', 'in_progress', 'completed', 'failed']

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TrainingAssignments({
  applicationId,
  catalog,
  assignments,
}: {
  applicationId: string
  catalog: Training[]
  assignments: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(assignments.map((a) => a.trainingId))
  const availableCatalog = catalog.filter((t) => !assignedIds.has(t.id))

  function parseScore(trainingId: string, fallback: string | null) {
    const raw = scoreDrafts[trainingId] ?? fallback ?? ''
    const trimmed = raw.trim()
    return trimmed ? Number(trimmed) : undefined
  }

  function assign() {
    if (!selected) return
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, selected, 'not_started')
      setSelected('')
      router.refresh()
    })
  }

  function cycleStatus(assignment: CandidateTrainingProgressRow) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(assignment.status) + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, assignment.trainingId, next, parseScore(assignment.trainingId, assignment.score))
      router.refresh()
    })
  }

  function saveScore(assignment: CandidateTrainingProgressRow) {
    startTransition(async () => {
      await setCandidateTrainingProgress(applicationId, assignment.trainingId, assignment.status, parseScore(assignment.trainingId, assignment.score))
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {assignments.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen gekoppeld.</p>}
      <ul className="space-y-2">
        {assignments.map((a) => (
          <li key={a.id} className="rounded-lg border border-border px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{a.training.title}</p>
                {a.training.standard && <p className="text-xs text-muted-foreground">{a.training.standard}</p>}
              </div>
              <button type="button" disabled={isPending} onClick={() => cycleStatus(a)}>
                <Badge variant="outline">{STATUS_LABELS[a.status]}</Badge>
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="Score"
                defaultValue={a.score ?? ''}
                onChange={(e) => setScoreDrafts((s) => ({ ...s, [a.trainingId]: e.target.value }))}
                className="h-8 w-28"
              />
              <Button variant="secondary" size="sm" disabled={isPending} onClick={() => saveScore(a)}>
                Score opslaan
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {availableCatalog.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een training...</option>
            {availableCatalog.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
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
