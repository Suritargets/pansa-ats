'use client'

/**
 * CandidateDetailSheet.tsx
 * WAT:    Rechts inschuivend detail-/bewerkpaneel voor één kandidaat, geopend vanuit de
 *         kandidatenlijst (CandidatesTable) zonder van pagina te wisselen.
 * WAAROM: De kandidatenlijst had geen detail-/edit-weergave — klikken deed niets.
 */

import { useActionState, useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDate } from '@/lib/utils'
import { updateCandidate, type UpdateCandidateState } from '@/services/candidates'
import type { Candidate } from '@/types/database'

const MARITAL_STATUS_LABELS: Record<string, string> = {
  gehuwd: 'Gehuwd',
  ongehuwd: 'Ongehuwd',
  concubinaat: 'Concubinaat',
  gescheiden: 'Gescheiden',
}

const GENDER_LABELS: Record<string, string> = { man: 'Man', vrouw: 'Vrouw' }

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const initialState: UpdateCandidateState = { success: false }

export function CandidateDetailSheet({
  candidate,
  open,
  onOpenChange,
}: {
  candidate: Candidate
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const boundAction = updateCandidate.bind(null, candidate.id)
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  // Na een geslaagde opslag terug naar view-mode — tijdens render afgeleid uit de
  // vorige actie-state (React's aanbevolen patroon, i.p.v. een effect).
  const [handledState, setHandledState] = useState(state)
  if (state !== handledState) {
    setHandledState(state)
    if (state.success) setMode('view')
  }

  const display = state.success && state.candidate ? state.candidate : candidate

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle>
                {display.firstName} {display.lastName}
              </SheetTitle>
              <SheetDescription>Geregistreerd op {formatDate(display.createdAt)}</SheetDescription>
            </div>
            {mode === 'view' && (
              <Button size="sm" variant="outline" onClick={() => setMode('edit')}>
                <Pencil className="size-4" />
                Bewerken
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === 'view' ? (
            <ViewFields candidate={display} />
          ) : (
            <form id="candidate-edit-form" action={formAction} className="space-y-4">
              {state.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Voornaam</Label>
                  <Input id="firstName" name="firstName" defaultValue={display.firstName} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Achternaam</Label>
                  <Input id="lastName" name="lastName" defaultValue={display.lastName} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" defaultValue={display.email ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input id="phone" name="phone" defaultValue={display.phone ?? ''} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={display.dateOfBirth ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationality">Nationaliteit</Label>
                  <Input id="nationality" name="nationality" defaultValue={display.nationality ?? ''} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Geslacht</Label>
                  <select id="gender" name="gender" defaultValue={display.gender ?? ''} className={selectClasses}>
                    <option value="">—</option>
                    <option value="man">Man</option>
                    <option value="vrouw">Vrouw</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maritalStatus">Burgerlijke staat</Label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    defaultValue={display.maritalStatus ?? ''}
                    className={selectClasses}
                  >
                    <option value="">—</option>
                    <option value="ongehuwd">Ongehuwd</option>
                    <option value="gehuwd">Gehuwd</option>
                    <option value="concubinaat">Concubinaat</option>
                    <option value="gescheiden">Gescheiden</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="residence">Woonplaats</Label>
                  <Input id="residence" name="residence" defaultValue={display.residence ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" name="district" defaultValue={display.district ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yearsExperience">Jaren ervaring</Label>
                  <Input id="yearsExperience" name="yearsExperience" type="number" min="0" step="0.5" defaultValue={display.yearsExperience ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" name="address" defaultValue={display.address ?? ''} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="driversLicenseCategory">Rijbewijscategorie</Label>
                  <Input
                    id="driversLicenseCategory"
                    name="driversLicenseCategory"
                    defaultValue={display.driversLicenseCategory ?? ''}
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      name="hasDriversLicense"
                      defaultChecked={display.hasDriversLicense ?? false}
                      className="size-4 rounded border-input"
                    />
                    Heeft rijbewijs
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="skills">Vaardigheden (komma-gescheiden)</Label>
                <Input id="skills" name="skills" defaultValue={display.skills.join(', ')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="certifications">Certificaten (komma-gescheiden)</Label>
                <Input id="certifications" name="certifications" defaultValue={display.certifications.join(', ')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notities</Label>
                <Textarea id="notes" name="notes" defaultValue={display.notes ?? ''} />
              </div>
            </form>
          )}
        </div>

        {mode === 'edit' && (
          <SheetFooter className="justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setMode('view')} disabled={pending}>
              Annuleren
            </Button>
            <Button type="submit" form="candidate-edit-form" size="sm" disabled={pending}>
              {pending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ViewFields({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <Field label="E-mail" value={candidate.email} />
        <Field label="Telefoon" value={candidate.phone} />
        <Field label="Geboortedatum" value={formatDate(candidate.dateOfBirth)} />
        <Field label="Geboorteplaats" value={candidate.birthPlace} />
        <Field label="Nationaliteit" value={candidate.nationality} />
        <Field label="Geslacht" value={GENDER_LABELS[candidate.gender ?? '']} />
        <Field label="Burgerlijke staat" value={MARITAL_STATUS_LABELS[candidate.maritalStatus ?? '']} />
        <Field label="Jaren ervaring" value={candidate.yearsExperience?.toString()} />
        <Field label="Woonplaats" value={candidate.residence} />
        <Field label="District" value={candidate.district} />
        <Field label="Adres" value={candidate.address} />
        <Field
          label="Rijbewijs"
          value={
            candidate.hasDriversLicense === null
              ? undefined
              : candidate.hasDriversLicense
                ? `Ja — categorie ${candidate.driversLicenseCategory || '?'}`
                : 'Nee'
          }
        />
      </dl>

      {candidate.skills.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Vaardigheden</h3>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {candidate.certifications.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Certificaten</h3>
          <div className="flex flex-wrap gap-1.5">
            {candidate.certifications.map((cert) => (
              <span key={cert} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {candidate.education.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Opleiding</h3>
          <ul className="space-y-1 text-sm text-foreground">
            {candidate.education.map((entry, i) => (
              <li key={i}>
                {entry.level}
                {entry.fieldOfStudy ? ` — ${entry.fieldOfStudy}` : ''} ({entry.completed ? 'afgerond' : 'niet afgerond'})
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidate.workHistory.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Werkervaring</h3>
          <ul className="space-y-2 text-sm text-foreground">
            {candidate.workHistory.map((entry, i) => (
              <li key={i}>
                <span className="font-medium">{entry.company}</span>
                {entry.role ? ` — ${entry.role}` : ''}
                {entry.period ? <span className="text-muted-foreground"> ({entry.period})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidate.notes && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notities</h3>
          <p className="text-sm whitespace-pre-wrap text-foreground">{candidate.notes}</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || '—'}</dd>
    </div>
  )
}
