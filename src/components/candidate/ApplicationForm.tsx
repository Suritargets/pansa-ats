'use client'

/**
 * ApplicationForm.tsx
 * WAT:    Sollicitatieformulier — `mode="public"` (kandidaat zelf) of `mode="digitize"`
 *         (staff vult over van een handgeschreven formulier + koppelt de scan, evt. via
 *         AI-OCR voorgevuld). Velden volgen 1-op-1 het echte registratieformulier, zie
 *         `.claude/skills/pansa-ats-process/references/registratie-form.md`.
 * WAAROM: Bedrijf/functie/burgerlijke staat/geslacht gebruiken native <select> (goede
 *         mobiele UX, werkt direct met react-hook-form's `register`).
 */

import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FALLBACK_POSITIONS } from '@/constants/companies'
import { submitApplication, uploadApplicationDocument } from '@/services/applications'
import type { Company, JobCategory } from '@/types/database'
import { cn } from '@/lib/utils'

const educationEntrySchema = z.object({
  level: z.string().min(1, 'Verplicht'),
  fieldOfStudy: z.string().optional(),
  completed: z.boolean(),
  notes: z.string().optional(),
})

const priorTrainingEntrySchema = z.object({
  kind: z.string().optional(),
  title: z.string().min(1, 'Verplicht'),
  period: z.string().optional(),
  completed: z.boolean(),
})

const workHistoryEntrySchema = z.object({
  period: z.string().optional(),
  company: z.string().min(1, 'Verplicht'),
  role: z.string().optional(),
  salary: z.string().optional(),
  reasonForLeaving: z.string().optional(),
})

const schema = z.object({
  firstName: z.string().min(1, 'Verplicht'),
  lastName: z.string().min(1, 'Verplicht'),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  phone: z.string().min(6, 'Verplicht'),
  dateOfBirth: z.string().optional(),
  birthPlace: z.string().optional(),
  idNumber: z.string().optional(),
  originVillage: z.string().optional(),
  traditionalAuthority: z.string().optional(),
  address: z.string().optional(),
  residence: z.string().optional(),
  district: z.string().optional(),
  maritalStatus: z.enum(['gehuwd', 'ongehuwd', 'concubinaat', 'gescheiden']).optional().or(z.literal('')),
  gender: z.enum(['man', 'vrouw']).optional().or(z.literal('')),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  ethnicGroup: z.string().optional(),
  hasJusticeRecord: z.boolean().optional(),
  justiceRecordReason: z.string().optional(),
  hasDriversLicense: z.boolean().optional(),
  driversLicenseCategory: z.string().optional(),
  yearsExperience: z.string().optional(),
  companyId: z.string().min(1, 'Kies een bedrijf'),
  jobCategoryId: z.string().min(1, 'Kies een functie'),
  coverNote: z.string().optional(),
  education: z.array(educationEntrySchema),
  priorTrainings: z.array(priorTrainingEntrySchema),
  workHistory: z.array(workHistoryEntrySchema),
  workedSimilarCompanyBefore: z.boolean().optional(),
  workedSimilarCompanyDetails: z.string().optional(),
  lastJobDescription: z.string().optional(),
  lastSupervisorName: z.string().optional(),
  lastSupervisorContact: z.string().optional(),
  availabilityDate: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  relatedToStaffMember: z.boolean().optional(),
  relatedToStaffMemberDetails: z.string().optional(),
  personalCompetencies: z.string().optional(),
  languageSkills: z.string().optional(),
})

export type ApplicationFormValues = z.infer<typeof schema>

const STEPS: { id: string; title: string; fields: (keyof ApplicationFormValues)[] }[] = [
  {
    id: 'personal',
    title: 'Persoonlijke gegevens',
    fields: [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'birthPlace', 'idNumber',
      'originVillage', 'traditionalAuthority', 'address', 'residence', 'district',
      'maritalStatus', 'gender', 'nationality', 'religion', 'ethnicGroup', 'yearsExperience',
    ],
  },
  {
    id: 'legal',
    title: 'Justitie & rijbewijs',
    fields: ['hasJusticeRecord', 'justiceRecordReason', 'hasDriversLicense', 'driversLicenseCategory'],
  },
  {
    id: 'application',
    title: 'Sollicitatie',
    fields: ['companyId', 'jobCategoryId', 'coverNote'],
  },
  {
    id: 'education',
    title: 'Opleiding & training',
    fields: ['education', 'priorTrainings'],
  },
  {
    id: 'work',
    title: 'Werkervaring',
    fields: ['workHistory'],
  },
  {
    id: 'other',
    title: 'Overig',
    fields: [
      'workedSimilarCompanyBefore', 'workedSimilarCompanyDetails', 'lastJobDescription',
      'lastSupervisorName', 'lastSupervisorContact', 'availabilityDate', 'bankAccountNumber', 'bankName',
      'relatedToStaffMember', 'relatedToStaffMemberDetails', 'personalCompetencies', 'languageSkills',
    ],
  },
  {
    id: 'documents',
    title: 'Documenten',
    fields: [],
  },
]

interface ApplicationFormProps {
  mode: 'public' | 'digitize'
  companies: Company[]
  jobCategories: JobCategory[]
  /** Vult het formulier (opnieuw) met AI-OCR-resultaat — zie DigitizeWorkspace.tsx. */
  ocrData?: Partial<ApplicationFormValues> | null
  /** De geüploade scan die voor de OCR gebruikt is — voorkomt dat staff hem twee keer moet uploaden. */
  initialScanFile?: File | null
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const DEFAULT_VALUES: ApplicationFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  birthPlace: '',
  idNumber: '',
  originVillage: '',
  traditionalAuthority: '',
  address: '',
  residence: '',
  district: '',
  maritalStatus: '',
  gender: '',
  nationality: '',
  religion: '',
  ethnicGroup: '',
  hasJusticeRecord: false,
  justiceRecordReason: '',
  hasDriversLicense: false,
  driversLicenseCategory: '',
  yearsExperience: '',
  companyId: '',
  jobCategoryId: '',
  coverNote: '',
  education: [],
  priorTrainings: [],
  workHistory: [],
  workedSimilarCompanyBefore: false,
  workedSimilarCompanyDetails: '',
  lastJobDescription: '',
  lastSupervisorName: '',
  lastSupervisorContact: '',
  availabilityDate: '',
  bankAccountNumber: '',
  bankName: '',
  relatedToStaffMember: false,
  relatedToStaffMemberDetails: '',
  personalCompetencies: '',
  languageSkills: '',
}

export function ApplicationForm({ mode, companies, jobCategories, ocrData, initialScanFile }: ApplicationFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  // `initialScanFile`/`ocrData` only need to be read once per mount — DigitizeWorkspace
  // remounts this component (via `key`) whenever new OCR-data arrives, so a plain
  // useState-at-mount is correct here and no effect is needed to "sync" a prop into state.
  const [scanFile, setScanFile] = useState<File | null>(initialScanFile ?? null)

  const [stepIndex, setStepIndex] = useState(0)

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: ocrData ? { ...DEFAULT_VALUES, ...ocrData } : DEFAULT_VALUES,
  })

  const isLastStep = stepIndex === STEPS.length - 1

  async function goNext() {
    const valid = await trigger(STEPS[stepIndex].fields)
    if (valid) setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function preventEnterSubmit(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !isLastStep && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
    }
  }

  const educationArray = useFieldArray({ control, name: 'education' })
  const trainingArray = useFieldArray({ control, name: 'priorTrainings' })
  const workHistoryArray = useFieldArray({ control, name: 'workHistory' })

  const hasJusticeRecord = useWatch({ control, name: 'hasJusticeRecord' })
  const hasDriversLicense = useWatch({ control, name: 'hasDriversLicense' })
  const workedSimilarCompanyBefore = useWatch({ control, name: 'workedSimilarCompanyBefore' })
  const relatedToStaffMember = useWatch({ control, name: 'relatedToStaffMember' })

  async function onSubmit(values: ApplicationFormValues) {
    setStatus('submitting')
    setErrorMessage(null)

    const selectedJobCategory = jobCategories.find((jc) => jc.id === values.jobCategoryId)

    const result = await submitApplication(
      {
        companyId: values.companyId,
        jobCategoryId: values.jobCategoryId,
        positionApplied: selectedJobCategory?.name ?? values.jobCategoryId,
        source: mode === 'digitize' ? 'digitized_paper' : 'online_form',
        coverNote: values.coverNote,
        candidate: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth || undefined,
          birthPlace: values.birthPlace || undefined,
          address: values.address,
          residence: values.residence || undefined,
          district: values.district || undefined,
          originVillage: values.originVillage || undefined,
          traditionalAuthority: values.traditionalAuthority || undefined,
          idNumber: values.idNumber,
          nationality: values.nationality,
          maritalStatus: values.maritalStatus || undefined,
          gender: values.gender || undefined,
          religion: values.religion || undefined,
          ethnicGroup: values.ethnicGroup || undefined,
          hasJusticeRecord: values.hasJusticeRecord,
          justiceRecordReason: values.justiceRecordReason || undefined,
          hasDriversLicense: values.hasDriversLicense,
          driversLicenseCategory: values.driversLicenseCategory || undefined,
          education: values.education,
          priorTrainings: values.priorTrainings,
          workHistory: values.workHistory,
          workedSimilarCompanyBefore: values.workedSimilarCompanyBefore,
          workedSimilarCompanyDetails: values.workedSimilarCompanyDetails || undefined,
          lastJobDescription: values.lastJobDescription || undefined,
          lastSupervisorName: values.lastSupervisorName || undefined,
          lastSupervisorContact: values.lastSupervisorContact || undefined,
          availabilityDate: values.availabilityDate || undefined,
          bankAccountNumber: values.bankAccountNumber || undefined,
          bankName: values.bankName || undefined,
          relatedToStaffMember: values.relatedToStaffMember,
          relatedToStaffMemberDetails: values.relatedToStaffMemberDetails || undefined,
          personalCompetencies: values.personalCompetencies || undefined,
          languageSkills: values.languageSkills || undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEnterSubmit} className="space-y-8">
      {mode === 'digitize' && (
        <Alert>
          <AlertDescription>
            Vul de gegevens over van het handgeschreven formulier (of gebruik AI-OCR hierboven) en upload een
            scan/foto hieronder als bewijs.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Stap {stepIndex + 1} van {STEPS.length} — {STEPS[stepIndex].title}
        </p>
        <div className="flex gap-1">
          {STEPS.map((step, i) => (
            <span
              key={step.id}
              className={cn('h-1.5 flex-1 rounded-full', i <= stepIndex ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>
      </div>

      {stepIndex === 0 && (
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
          <FormField label="Geboorteplaats">
            <Input {...register('birthPlace')} />
          </FormField>
          <FormField label="ID/Paspoortnummer">
            <Input {...register('idNumber')} />
          </FormField>
          <FormField label="Nationaliteit">
            <Input {...register('nationality')} />
          </FormField>
          <FormField label="Burgerlijke staat">
            <select className={cn(selectClasses)} {...register('maritalStatus')}>
              <option value="">Kies...</option>
              <option value="gehuwd">Gehuwd</option>
              <option value="ongehuwd">Ongehuwd</option>
              <option value="concubinaat">Concubinaat</option>
              <option value="gescheiden">Gescheiden</option>
            </select>
          </FormField>
          <FormField label="Geslacht">
            <select className={cn(selectClasses)} {...register('gender')}>
              <option value="">Kies...</option>
              <option value="man">Man</option>
              <option value="vrouw">Vrouw</option>
            </select>
          </FormField>
          <FormField label="Godsdienst">
            <Input {...register('religion')} />
          </FormField>
          <FormField label="Bevolkingsgroep">
            <Input {...register('ethnicGroup')} />
          </FormField>
          <FormField label="Jaren werkervaring">
            <Input type="number" step="0.5" {...register('yearsExperience')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Huidig adres">
            <Textarea {...register('address')} />
          </FormField>
          <div className="grid gap-4">
            <FormField label="Woonplaats">
              <Input {...register('residence')} />
            </FormField>
            <FormField label="District">
              <Input {...register('district')} />
            </FormField>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Afkomstig van het dorp (naam)" hint="Alleen relevant voor kandidaten uit het binnenland">
            <Input {...register('originVillage')} />
          </FormField>
          <FormField label="Traditioneel gezag van het dorp (titel & naam)">
            <Input {...register('traditionalAuthority')} />
          </FormField>
        </div>
      </section>
      )}

      {stepIndex === 1 && (
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Justitie &amp; rijbewijs</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <CheckboxField label="Ooit in aanraking geweest met justitie" {...register('hasJusticeRecord')} />
            {hasJusticeRecord && (
              <Input placeholder="Reden" {...register('justiceRecordReason')} />
            )}
          </div>
          <div className="space-y-2">
            <CheckboxField label="In bezit van een geldig rijbewijs" {...register('hasDriversLicense')} />
            {hasDriversLicense && (
              <Input placeholder="Categorie" {...register('driversLicenseCategory')} />
            )}
          </div>
        </div>
      </section>
      )}

      {stepIndex === 2 && (
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
          <FormField label="Functie" error={errors.jobCategoryId?.message}>
            <select className={cn(selectClasses)} {...register('jobCategoryId')} defaultValue="">
              <option value="">Kies een functie...</option>
              {(jobCategories.length > 0 ? jobCategories.map((jc) => ({ id: jc.id, name: jc.name })) : FALLBACK_POSITIONS.map((p) => ({ id: p, name: p }))).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Motivatie / opmerkingen">
          <Textarea {...register('coverNote')} />
        </FormField>
      </section>
      )}

      {stepIndex === 3 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Opleiding &amp; training
          </h3>
        </div>
        <div className="space-y-3">
          {educationArray.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Input placeholder="Opleidingsniveau" {...register(`education.${index}.level`)} />
              <Input placeholder="Studierichting" {...register(`education.${index}.fieldOfStudy`)} />
              <CheckboxField label="Afgerond" {...register(`education.${index}.completed`)} />
              <Button type="button" variant="ghost" onClick={() => educationArray.remove(index)}>
                Verwijderen
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => educationArray.append({ level: '', fieldOfStudy: '', completed: false, notes: '' })}
          >
            + Opleiding toevoegen
          </Button>
        </div>

        <div className="space-y-3">
          {trainingArray.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
              <Input placeholder="Soort training" {...register(`priorTrainings.${index}.kind`)} />
              <Input placeholder="Titel" {...register(`priorTrainings.${index}.title`)} />
              <Input placeholder="Periode" {...register(`priorTrainings.${index}.period`)} />
              <CheckboxField label="Afgerond" {...register(`priorTrainings.${index}.completed`)} />
              <Button type="button" variant="ghost" onClick={() => trainingArray.remove(index)}>
                Verwijderen
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => trainingArray.append({ kind: '', title: '', period: '', completed: false })}
          >
            + Training toevoegen
          </Button>
        </div>
      </section>
      )}

      {stepIndex === 4 && (
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Werkervaring (laatste werkgevers, meest recente eerst)
        </h3>
        <div className="space-y-3">
          {workHistoryArray.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              <Input placeholder="Periode" {...register(`workHistory.${index}.period`)} />
              <Input placeholder="Bedrijf" {...register(`workHistory.${index}.company`)} />
              <Input placeholder="Functie/skills" {...register(`workHistory.${index}.role`)} />
              <Input placeholder="Genoten salaris" {...register(`workHistory.${index}.salary`)} />
              <Textarea
                placeholder="Reden van vertrek"
                className="sm:col-span-2"
                {...register(`workHistory.${index}.reasonForLeaving`)}
              />
              <Button type="button" variant="ghost" className="sm:col-span-2" onClick={() => workHistoryArray.remove(index)}>
                Verwijderen
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => workHistoryArray.append({ period: '', company: '', role: '', salary: '', reasonForLeaving: '' })}
          >
            + Werkgever toevoegen
          </Button>
        </div>
      </section>
      )}

      {stepIndex === 5 && (
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overig</h3>
        <div className="space-y-2">
          <CheckboxField label="Eerder voor een soortgelijk bedrijf gewerkt" {...register('workedSimilarCompanyBefore')} />
          {workedSimilarCompanyBefore && (
            <Textarea placeholder="Periode en reden van vertrek" {...register('workedSimilarCompanyDetails')} />
          )}
        </div>
        <FormField label="Korte omschrijving laatste functie/baan">
          <Textarea {...register('lastJobDescription')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Naam laatste supervisor/afdelingshoofd">
            <Input {...register('lastSupervisorName')} />
          </FormField>
          <FormField label="Contactnummer laatste supervisor">
            <Input {...register('lastSupervisorContact')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Beschikbaar vanaf">
            <Input type="date" {...register('availabilityDate')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Girorekeningnummer">
            <Input {...register('bankAccountNumber')} />
          </FormField>
          <FormField label="Bank">
            <Input {...register('bankName')} />
          </FormField>
        </div>
        <div className="space-y-2">
          <CheckboxField label="Familielid werkzaam bij Pansa Group/HPS" {...register('relatedToStaffMember')} />
          {relatedToStaffMember && (
            <Input placeholder="Relatie en naam familielid" {...register('relatedToStaffMemberDetails')} />
          )}
        </div>
        <FormField label="Persoonlijke competenties" hint="Voor op het CV">
          <Textarea {...register('personalCompetencies')} />
        </FormField>
        <FormField label="Taalvaardigheid" hint="Welke talen spreek/lees/schrijf je?">
          <Textarea {...register('languageSkills')} />
        </FormField>
      </section>
      )}

      {stepIndex === 6 && (
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documenten</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileInput label="CV (optioneel)" onChange={setCvFile} />
          {mode === 'digitize' && (
            <div>
              <FileInput label="Scan/foto van het handgeschreven formulier" onChange={setScanFile} />
              {scanFile && (
                <p className="mt-1 text-xs text-muted-foreground">Huidig bestand: {scanFile.name}</p>
              )}
            </div>
          )}
        </div>
      </section>
      )}

      {status === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <Button type="button" variant="secondary" onClick={goBack}>
            Vorige
          </Button>
        ) : (
          <span />
        )}

        {isLastStep ? (
          <Button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Bezig met opslaan...' : mode === 'digitize' ? 'Digitaliseren' : 'Solliciteer nu'}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            Volgende
          </Button>
        )}
      </div>
    </form>
  )
}

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const CheckboxField = ({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <label className="flex items-center gap-2 text-sm text-foreground">
    <input type="checkbox" className="size-4" {...props} />
    {label}
  </label>
)
CheckboxField.displayName = 'CheckboxField'

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
