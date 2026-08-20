'use client'

/**
 * ProbationEvaluation.tsx
 * WAT:    Proeftijdevaluatie week 4 (tussentijds) en week 8 (eind) bij het proeftijd-
 *         contractstadium — notities per evaluatiemoment, zoals vereist in de
 *         aanstellingsprocedure.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProbationNotes } from '@/services/contracts'
import type { EmploymentContract } from '@/types/database'

function WeekNotes({
  contractId,
  applicationId,
  week,
  label,
  initialNotes,
}: {
  contractId: string
  applicationId: string
  week: 4 | 8
  label: string
  initialNotes: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(initialNotes)

  function save() {
    startTransition(async () => {
      await updateProbationNotes(contractId, applicationId, week, notes)
      router.refresh()
    })
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={save}>
        {isPending ? 'Bezig...' : 'Opslaan'}
      </Button>
    </div>
  )
}

export function ProbationEvaluation({
  contracts,
  applicationId,
}: {
  contracts: EmploymentContract[]
  applicationId: string
}) {
  const probationContract = contracts.find((c) => c.stage === 'probation_2m')

  if (!probationContract) return null

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Proeftijdevaluatie</h3>
        <p className="text-xs text-muted-foreground">
          Tussentijdse evaluatie (week 4) en eindevaluatie proeftijd (week 8).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <WeekNotes
          contractId={probationContract.id}
          applicationId={applicationId}
          week={4}
          label="Evaluatie week 4"
          initialNotes={probationContract.probationWeek4Notes ?? ''}
        />
        <WeekNotes
          contractId={probationContract.id}
          applicationId={applicationId}
          week={8}
          label="Evaluatie week 8"
          initialNotes={probationContract.probationWeek8Notes ?? ''}
        />
      </div>
    </div>
  )
}
