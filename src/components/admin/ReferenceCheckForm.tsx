'use client'

/**
 * ReferenceCheckForm.tsx
 * WAT:    Antecedentenonderzoek vastleggen (Vragenlijst PGC-HR-F-0507-04) + lijst van reeds
 *         gedane referentiechecks van deze sollicitatie.
 * WAAROM: Het formulier volgt de papieren vragenlijst in volgorde en bewoording. De referent wordt
 *         voorgevuld uit de gegevens die de sollicitant opgaf (laatste supervisor + laatste werkgever).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addReferenceCheck, deleteReferenceCheck } from '@/services/reference-checks'
import { formatDate } from '@/lib/utils'
import type { ReferenceCheck } from '@/types/database'

export interface ReferenceCheckDefaults {
  refereeName?: string | null
  refereePhone?: string | null
  refereeCompany?: string | null
}

export function ReferenceCheckForm({
  applicationId,
  candidateName,
  defaults,
}: {
  applicationId: string
  candidateName: string
  defaults: ReferenceCheckDefaults
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // `key` op het formulier: na opslaan opnieuw mounten leegt alle uncontrolled velden.
  const [formKey, setFormKey] = useState(0)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const text = (name: string) => String(data.get(name) ?? '')
    const rehire = text('wouldRehire')

    setError(null)
    startTransition(async () => {
      const result = await addReferenceCheck(applicationId, {
        refereeName: text('refereeName'),
        refereePosition: text('refereePosition'),
        refereeCompany: text('refereeCompany'),
        refereeAddress: text('refereeAddress'),
        refereePhone: text('refereePhone'),
        employmentDuration: text('employmentDuration'),
        reasonForLeaving: text('reasonForLeaving'),
        department: text('department'),
        positionsHeld: text('positionsHeld'),
        oneWord: text('oneWord'),
        oneWordReason: text('oneWordReason'),
        workAttitude: text('workAttitude'),
        wouldRehire: rehire === 'yes' ? true : rehire === 'no' ? false : null,
        notes: text('notes'),
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      setFormKey((k) => k + 1)
      router.refresh()
    })
  }

  const x = `(X) = ${candidateName}`

  return (
    <form key={formKey} onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Nieuw antecedentenonderzoek</h3>
        <p className="text-xs text-muted-foreground">
          Vragenlijst antecedentenonderzoek (PGC-HR-F-0507-04) — bel de referent uit de sollicitatie. {x}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Referent</legend>
        <Field label="Naam" name="refereeName" defaultValue={defaults.refereeName ?? ''} />
        <Field label="Functie" name="refereePosition" />
        <Field label="Bedrijf" name="refereeCompany" defaultValue={defaults.refereeCompany ?? ''} />
        <Field label="Telefoonnummer" name="refereePhone" defaultValue={defaults.refereePhone ?? ''} />
        <div className="sm:col-span-2">
          <Field label="Adres" name="refereeAddress" />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Vragen</legend>
        <Field label="Hoelang was (X) in dienst binnen uw organisatie?" name="employmentDuration" />
        <Field label="Met welke reden heeft (X) uw organisatie verlaten?" name="reasonForLeaving" />
        <Field label="Bij welke afdeling heeft (X) gewerkt?" name="department" />
        <Field label="Welke functie(s) heeft (X) bekleed?" name="positionsHeld" />
        <Field label="Kunt u (X) beschrijven in één woord?" name="oneWord" />
        <Field label="En waarom speciaal dat woord?" name="oneWordReason" />
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="workAttitude">Kunt u mij wat vertellen over de werkattitude van (X)?</Label>
          <Textarea id="workAttitude" name="workAttitude" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wouldRehire">Zou u (X) weer in dienst willen nemen?</Label>
          <select
            id="wouldRehire"
            name="wouldRehire"
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Niet beantwoord</option>
            <option value="yes">Ja</option>
            <option value="no">Nee</option>
          </select>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Overige notities</Label>
        <Textarea id="notes" name="notes" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Bezig...' : 'Antecedentenonderzoek opslaan'}
      </Button>
    </form>
  )
}

export function ReferenceChecksList({ checks, applicationId }: { checks: ReferenceCheck[]; applicationId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (checks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen antecedentenonderzoek vastgelegd.</p>
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteReferenceCheck(id, applicationId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {checks.map((check) => (
        <Card key={check.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm">
                  {check.refereeName || 'Referent onbekend'}
                  {check.refereePosition ? ` — ${check.refereePosition}` : ''}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {[check.refereeCompany, check.refereePhone].filter(Boolean).join(' · ') || '—'} · gebeld op{' '}
                  {formatDate(check.checkedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => remove(check.id)}
                title="Verwijderen"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="In dienst" value={check.employmentDuration} />
              <Row label="Reden vertrek" value={check.reasonForLeaving} />
              <Row label="Afdeling" value={check.department} />
              <Row label="Functie(s)" value={check.positionsHeld} />
              <Row
                label="In één woord"
                value={[check.oneWord, check.oneWordReason && `(${check.oneWordReason})`].filter(Boolean).join(' ')}
              />
              <Row
                label="Weer in dienst nemen"
                value={check.wouldRehire === null ? null : check.wouldRehire ? 'Ja' : 'Nee'}
              />
              <div className="sm:col-span-2">
                <Row label="Werkattitude" value={check.workAttitude} />
              </div>
              <div className="sm:col-span-2">
                <Row label="Notities" value={check.notes} />
              </div>
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || '—'}</dd>
    </div>
  )
}
