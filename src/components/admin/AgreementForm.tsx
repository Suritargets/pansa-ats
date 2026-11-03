/**
 * AgreementForm.tsx
 * WAT:    Formulier voor een dienstverlenings-overeenkomst met een klant: soort, status, looptijd,
 *         automatisch verlengen, opzegtermijn en waarde.
 */

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAgreement, updateAgreement } from '@/services/agreements'
import { AGREEMENT_KIND_LABELS, AGREEMENT_STATUS_LABELS } from '@/lib/service-agreements'
import type { ServiceAgreement } from '../../../drizzle/schema'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function AgreementForm({
  agreement,
  clientId,
  saved,
  error,
}: {
  agreement?: ServiceAgreement
  clientId: string
  saved?: boolean
  error?: string
}) {
  const action = agreement ? updateAgreement.bind(null, agreement.id) : createAgreement.bind(null, clientId)

  return (
    <form action={action} className="max-w-xl space-y-4">
      {saved && (
        <Alert>
          <AlertDescription>Opgeslagen.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" defaultValue={agreement?.title} required placeholder="Bijv. Raamovereenkomst detachering 2027" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="kind">Soort</Label>
          <select id="kind" name="kind" defaultValue={agreement?.kind ?? 'framework'} className={selectClasses}>
            {Object.entries(AGREEMENT_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={agreement?.status ?? 'draft'} className={selectClasses}>
            {Object.entries(AGREEMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Startdatum</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={agreement?.startDate ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Einddatum</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={agreement?.endDate ?? ''} />
          <p className="text-xs text-muted-foreground">Leeg = doorlopend.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="termMonths">Periode (maanden)</Label>
          <Input id="termMonths" name="termMonths" type="number" min={1} max={120} defaultValue={agreement?.termMonths ?? 12} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="noticeDays">Opzegtermijn (dagen)</Label>
          <Input id="noticeDays" name="noticeDays" type="number" min={0} max={365} defaultValue={agreement?.noticeDays ?? 30} />
        </div>
        <label className="flex items-center gap-2 self-end pb-1.5 text-sm">
          <input type="checkbox" name="autoRenew" defaultChecked={agreement?.autoRenew ?? false} className="size-4 accent-[var(--color-brand-green)]" />
          Automatisch verlengen
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <div className="space-y-1.5">
          <Label htmlFor="value">Waarde per periode</Label>
          <Input id="value" name="value" inputMode="decimal" defaultValue={agreement?.value ?? ''} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Valuta</Label>
          <Input id="currency" name="currency" maxLength={3} defaultValue={agreement?.currency ?? 'USD'} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notities</Label>
        <Textarea id="notes" name="notes" defaultValue={agreement?.notes ?? ''} rows={3} />
      </div>
      <Button type="submit">{agreement ? 'Opslaan' : 'Overeenkomst aanmaken'}</Button>
    </form>
  )
}
