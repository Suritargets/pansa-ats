'use client'

/**
 * ContractForm.tsx
 * WAT:    Nieuw arbeidsovereenkomst-stadium toevoegen (proeftijd 2mnd -> 4mnd -> verlengingen).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { addContract } from '@/services/contracts'
import type { ContractStage, ContractStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STAGE_LABELS: Record<ContractStage, string> = {
  probation_2m: 'Proeftijd (2 maanden)',
  term_4m: 'Termijn (4 maanden)',
  extension_6m: 'Verlenging (6 maanden)',
  extension_12m: 'Verlenging (12 maanden)',
  permanent: 'Vast',
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  ended: 'Beëindigd',
  terminated: 'Ontbonden',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function ContractForm({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [stage, setStage] = useState<ContractStage>('probation_2m')
  const [status, setStatus] = useState<ContractStatus>('active')
  const [startDate, setStartDate] = useState('')
  const [hourlyWage, setHourlyWage] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addContract(applicationId, {
        stage,
        status,
        startDate: startDate || undefined,
        hourlyWage: hourlyWage ? Number(hourlyWage) : undefined,
        badgeNumber: badgeNumber || undefined,
      })
      setStartDate('')
      setHourlyWage('')
      setBadgeNumber('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Stadium</Label>
          <select value={stage} onChange={(e) => setStage(e.target.value as ContractStage)} className={cn(selectClasses)}>
            {(Object.entries(STAGE_LABELS) as [ContractStage, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ContractStatus)} className={cn(selectClasses)}>
            {(Object.entries(STATUS_LABELS) as [ContractStatus, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Startdatum</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Uurloon</Label>
          <Input type="number" step="0.01" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Badgenummer</Label>
          <Input value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Bezig...' : 'Stadium toevoegen'}
      </Button>
    </form>
  )
}
