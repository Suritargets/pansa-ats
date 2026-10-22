'use client'

/**
 * ContractControls.tsx
 * WAT:    Per contractstadium: status wijzigen (concept → actief → beëindigd/ontbonden) en, voor het
 *         proeftijd-stadium, de beoordelingen op week 4 en week 8 vastleggen (Proeftijd
 *         beoordelingsformulier uit PGC-HR-PR-0501-05).
 * WAAROM: `setContractStatus` en `updateProbationNotes` bestonden als actions maar hadden geen scherm,
 *         waardoor een contract nooit als beëindigd gemarkeerd kon worden (en dus eeuwig in de
 *         contractmonitor bleef staan).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, isValid, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { setContractStatus, updateProbationNotes } from '@/services/contracts'
import type { ContractStatus, EmploymentContract } from '@/types/database'

const STATUS_ACTIONS: Record<ContractStatus, { label: string; to: ContractStatus; variant: 'default' | 'outline' | 'destructive' }[]> = {
  draft: [{ label: 'Activeren', to: 'active', variant: 'default' }],
  active: [
    { label: 'Markeer als beëindigd', to: 'ended', variant: 'outline' },
    { label: 'Markeer als ontbonden', to: 'terminated', variant: 'destructive' },
  ],
  ended: [{ label: 'Heractiveren', to: 'active', variant: 'outline' }],
  terminated: [{ label: 'Heractiveren', to: 'active', variant: 'outline' }],
}

export function ContractControls({ contract, applicationId }: { contract: EmploymentContract; applicationId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [week4, setWeek4] = useState(contract.probationWeek4Notes ?? '')
  const [week8, setWeek8] = useState(contract.probationWeek8Notes ?? '')

  const start = contract.startDate ? parseISO(contract.startDate) : null
  const dueLabel = (weeks: number) =>
    start && isValid(start) ? ` — uiterlijk ${format(addDays(start, weeks * 7), 'd MMM yyyy', { locale: nl })}` : ''

  function changeStatus(to: ContractStatus) {
    startTransition(async () => {
      await setContractStatus(contract.id, applicationId, to)
      router.refresh()
    })
  }

  function saveNotes(week: 4 | 8, notes: string) {
    startTransition(async () => {
      await updateProbationNotes(contract.id, applicationId, week, notes)
      router.refresh()
    })
  }

  return (
    <div className="mt-3 space-y-4 border-t border-border pt-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_ACTIONS[contract.status].map((action) => (
          <Button
            key={action.to}
            type="button"
            size="sm"
            variant={action.variant}
            disabled={isPending}
            onClick={() => changeStatus(action.to)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {contract.stage === 'probation_2m' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`week4-${contract.id}`}>Beoordeling week 4{dueLabel(4)}</Label>
            <Textarea id={`week4-${contract.id}`} value={week4} onChange={(e) => setWeek4(e.target.value)} />
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={isPending || week4 === (contract.probationWeek4Notes ?? '')}
              onClick={() => saveNotes(4, week4)}
            >
              Opslaan
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`week8-${contract.id}`}>Eindbeoordeling week 8{dueLabel(8)}</Label>
            <Textarea id={`week8-${contract.id}`} value={week8} onChange={(e) => setWeek8(e.target.value)} />
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={isPending || week8 === (contract.probationWeek8Notes ?? '')}
              onClick={() => saveNotes(8, week8)}
            >
              Opslaan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
