'use client'

/**
 * DigitizeWorkspace.tsx
 * WAT:    Upload een scan/foto van een ingevuld papieren registratieformulier, laat AI
 *         (via extractRegistrationForm) de velden uitlezen, en vult het sollicitatieformulier
 *         voor — staff controleert en corrigeert alles voordat er iets wordt opgeslagen.
 */

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApplicationForm, type ApplicationFormValues } from '@/components/candidate/ApplicationForm'
import { extractRegistrationForm } from '@/services/ocr'
import { mapOcrResultToFormValues } from '@/lib/ocr-mapping'
import type { Company, JobCategory } from '@/types/database'

export function DigitizeWorkspace({ companies, jobCategories }: { companies: Company[]; jobCategories: JobCategory[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [ocrData, setOcrData] = useState<Partial<ApplicationFormValues> | null>(null)
  const [scanFileForForm, setScanFileForForm] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Verhoogd bij elke geslaagde OCR-run zodat <ApplicationForm key={formKey}> remount i.p.v.
  // een effect nodig te hebben om nieuwe ocrData/initialScanFile props in te syncen.
  const [formKey, setFormKey] = useState(0)

  function runOcr() {
    if (!file) return
    setError(null)

    startTransition(async () => {
      const result = await extractRegistrationForm(file)
      if (!result.success) {
        setError(result.error)
        return
      }

      setOcrData(mapOcrResultToFormValues(result.data, companies, jobCategories))
      setScanFileForForm(file)
      setFormKey((k) => k + 1)
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <Label>Foto/scan uploaden voor automatisch invullen (AI)</Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80"
          />
          <Button type="button" disabled={!file || isPending} onClick={runOcr}>
            {isPending ? 'Bezig met uitlezen...' : 'Automatisch invullen met AI'}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {ocrData && !error && (
          <Alert className="mt-3">
            <AlertDescription>
              Formulier hieronder voorgevuld op basis van de scan — controleer en corrigeer alle velden voordat je
              opslaat. Bedrijf en functie zijn alleen automatisch gekozen bij een exacte naamsovereenkomst.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <ApplicationForm
        key={formKey}
        mode="digitize"
        companies={companies}
        jobCategories={jobCategories}
        ocrData={ocrData}
        initialScanFile={scanFileForForm}
      />
    </div>
  )
}
