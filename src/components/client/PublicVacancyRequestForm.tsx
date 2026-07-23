'use client'

/**
 * PublicVacancyRequestForm.tsx
 * WAT:    Publieke (niet-ingelogde) versie van het vacature-aanvraagformulier — voor
 *         bedrijven zonder klantportaal-account. Zelfde functie-eisen-UI als
 *         VacancyRequestForm.tsx, plus bedrijfs-/contactgegevens.
 */

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { submitPublicVacancyRequest } from '@/services/public-intake'
import type { JobCategory, JobScopeEntry } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function PublicVacancyRequestForm({
  jobCategories,
  scopeCategories,
  saved,
  error,
  redirectTo,
}: {
  jobCategories: JobCategory[]
  scopeCategories: string[]
  saved?: boolean
  error?: boolean
  redirectTo: string
}) {
  const [jobScope, setJobScope] = useState<JobScopeEntry[]>([])

  function addRow() {
    setJobScope((rows) => [...rows, { category: scopeCategories[0] ?? '', requirement: '' }])
  }

  function removeRow(index: number) {
    setJobScope((rows) => rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, patch: Partial<JobScopeEntry>) {
    setJobScope((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <form action={submitPublicVacancyRequest} className="max-w-lg space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {saved && (
        <Alert>
          <AlertDescription>Bedankt! Je aanvraag is verstuurd — we nemen spoedig contact op.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Vul bedrijfsnaam, contactpersoon en e-mail in.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Bedrijfsnaam</Label>
          <Input id="companyName" name="companyName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contactpersoon</Label>
          <Input id="contactName" name="contactName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">E-mail</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">Telefoon</Label>
          <Input id="contactPhone" name="contactPhone" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jobCategoryId">Functie</Label>
        <select id="jobCategoryId" name="jobCategoryId" className={cn(selectClasses)} defaultValue="">
          <option value="">Kies een functie...</option>
          {jobCategories.map((jc) => (
            <option key={jc.id} value={jc.id}>
              {jc.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quantity">Aantal medewerkers</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Toelichting</Label>
        <Textarea id="notes" name="notes" placeholder="Projectlocatie, gewenste startdatum..." />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Functie-eisen per categorie</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            Eis toevoegen
          </Button>
        </div>
        {jobScope.map((row, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-2">
            <select
              className={cn(selectClasses, 'w-40 shrink-0')}
              value={row.category}
              onChange={(e) => updateRow(i, { category: e.target.value })}
            >
              {scopeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Textarea
              value={row.requirement}
              onChange={(e) => updateRow(i, { requirement: e.target.value })}
              placeholder="Vereiste kennis/vaardigheid..."
              className="min-h-8 flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <input type="hidden" name="jobScope" value={JSON.stringify(jobScope)} readOnly />
      </div>

      <Button type="submit">Aanvraag versturen</Button>
    </form>
  )
}
