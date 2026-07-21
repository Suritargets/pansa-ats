'use client'

/**
 * ApplicationForm.tsx
 * WAT:    Sollicitatieformulier — `mode="public"` (kandidaat zelf) of `mode="digitize"`
 *         (staff vult over van een handgeschreven formulier + koppelt de scan).
 * WAAROM: Bedrijf/functie gebruiken een native <select> (goede mobiele UX voor lange
 *         lijsten, en werkt direct met react-hook-form's `register`).
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OPEN_POSITIONS } from '@/constants/companies'
import { submitApplication, uploadApplicationDocument } from '@/services/applications'
import type { Company } from '@/types/database'
import { cn } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'Verplicht'),
  lastName: z.string().min(1, 'Verplicht'),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  phone: z.string().min(6, 'Verplicht'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  nationality: z.string().optional(),
  yearsExperience: z.string().optional(),
  companyId: z.string().min(1, 'Kies een bedrijf'),
  positionApplied: z.string().min(1, 'Kies een functie'),
  coverNote: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ApplicationFormProps {
  mode: 'public' | 'digitize'
  companies: Company[]
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function ApplicationForm({ mode, companies }: ApplicationFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [scanFile, setScanFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setStatus('submitting')
    setErrorMessage(null)

    const result = await submitApplication(
      {
        companyId: values.companyId,
        positionApplied: values.positionApplied,
        source: mode === 'digitize' ? 'digitized_paper' : 'online_form',
        coverNote: values.coverNote,
        candidate: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth || undefined,
          address: values.address,
          idNumber: values.idNumber,
          nationality: values.nationality,
          yearsExperience: values.yearsExperience ? Number(values.yearsExperience) : undefined,
        },
      },
      mode === 'digitize'
    )

    if (!result.success) {
      setStatus('error')
      setErrorMessage(result.error)
      return
    }

    const { applicationId, uploadToken } = result.data
    if (cvFile) await uploadApplicationDocument(applicationId, cvFile, 'cv', uploadToken)
    if (scanFile) await uploadApplicationDocument(applicationId, scanFile, 'handwritten_scan', uploadToken)

    setStatus('done')
  }

  if (status === 'done') {
    return (
      <Alert>
        <AlertDescription className="text-foreground">
          <p className="font-medium">
            {mode === 'digitize' ? 'Aanvraag gedigitaliseerd en opgeslagen.' : 'Bedankt voor je sollicitatie!'}
          </p>
          <p className="mt-1">
            {mode === 'digitize'
              ? 'De aanvraag staat nu in het systeem en kan verder verwerkt worden.'
              : 'We nemen zo snel mogelijk contact met je op.'}
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {mode === 'digitize' && (
        <Alert>
          <AlertDescription>
            Vul de gegevens over van het handgeschreven formulier en upload een scan/foto hieronder als bewijs.
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Persoonlijke gegevens</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Voornaam" error={errors.firstName?.message}>
            <Input {...register('firstName')} />
          </FormField>
          <FormField label="Achternaam" error={errors.lastName?.message}>
            <Input {...register('lastName')} />
          </FormField>
          <FormField label="E-mail" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormField>
          <FormField label="Telefoonnummer" error={errors.phone?.message}>
            <Input {...register('phone')} />
          </FormField>
          <FormField label="Geboortedatum">
            <Input type="date" {...register('dateOfBirth')} />
          </FormField>
          <FormField label="ID/Paspoortnummer">
            <Input {...register('idNumber')} />
          </FormField>
          <FormField label="Nationaliteit">
            <Input {...register('nationality')} />
          </FormField>
          <FormField label="Jaren werkervaring">
            <Input type="number" step="0.5" {...register('yearsExperience')} />
          </FormField>
        </div>
        <FormField label="Adres">
          <Textarea {...register('address')} />
        </FormField>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sollicitatie</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Bedrijf" error={errors.companyId?.message}>
            <select className={cn(selectClasses)} {...register('companyId')} defaultValue="">
              <option value="">Kies een bedrijf...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Functie" error={errors.positionApplied?.message}>
            <select className={cn(selectClasses)} {...register('positionApplied')} defaultValue="">
              <option value="">Kies een functie...</option>
              {OPEN_POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Motivatie / opmerkingen">
          <Textarea {...register('coverNote')} />
        </FormField>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documenten</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileInput label="CV (optioneel)" onChange={setCvFile} />
          {mode === 'digitize' && (
            <FileInput label="Scan/foto van het handgeschreven formulier" onChange={setScanFile} />
          )}
        </div>
      </section>

      {status === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Bezig met opslaan...' : mode === 'digitize' ? 'Digitaliseren' : 'Solliciteer nu'}
      </Button>
    </form>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function FileInput({ label, onChange }: { label: string; onChange: (file: File | null) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80"
      />
    </div>
  )
}
