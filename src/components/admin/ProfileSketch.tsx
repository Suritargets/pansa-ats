/**
 * ProfileSketch.tsx
 * WAT:    Detailweergave van één sollicitatie in het Pansa-ontwerp "Sollicitatie Details": kopkaart
 *         (avatar, naam, functie, contact, status, "Volgende stap"), tabs met als eerste Overzicht
 *         (sollicitatie-informatie, processtappen-tijdlijn, persoonsgegevens, vaardigheden) en daarna
 *         Profiel, Interviews, Antecedenten, Onboarding, Contract, Dossier en Documenten.
 * WAAROM: Server component — alle data komt al binnen als props; alleen de interactieve stukken
 *         (status-knoppen, formulieren, delen) zijn client components.
 */

import { Check, ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { StatusActions } from '@/components/admin/StatusActions'
import { InterviewForm } from '@/components/admin/InterviewForm'
import { InterviewsList } from '@/components/admin/InterviewsList'
import { ContractForm } from '@/components/admin/ContractForm'
import { ContractsList } from '@/components/admin/ContractsList'
import { OnboardingChecklist } from '@/components/admin/OnboardingChecklist'
import { CandidateTrainings } from '@/components/admin/CandidateTrainings'
import { ShareWithClient } from '@/components/admin/ShareWithClient'
import { ReferenceCheckForm, ReferenceChecksList } from '@/components/admin/ReferenceCheckForm'
import { DossierTab } from '@/components/admin/DossierTab'
import { WhatsAppActions } from '@/components/admin/WhatsAppActions'
import { EmergencyContactsCard } from '@/components/admin/EmergencyContactsCard'
import { Avatar } from '@/components/admin/Avatar'
import { coiSummaryLines } from '@/constants/coi'
import { DOCUMENT_LABELS, type DossierItem, type PreEmploymentItem } from '@/lib/dossier'
import { registrationLabel } from '@/lib/registration'
import { cn, formatDate } from '@/lib/utils'
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationDocument,
  type ApplicationStatus,
  type ApplicationStatusHistoryRow,
  type ApplicationWithCandidate,
  type CandidateTrainingProgressRow,
  type Client,
  type ClientCandidateShareRow,
  type EmergencyContact,
  type EmploymentContract,
  type Interview,
  type InterviewQuestion,
  type InterviewType,
  type OnboardingProgressRow,
  type OnboardingStepTemplate,
  type ReferenceCheck,
  type Training,
} from '@/types/database'

const MARITAL_STATUS_LABELS: Record<string, string> = {
  gehuwd: 'Gehuwd',
  ongehuwd: 'Ongehuwd',
  concubinaat: 'Concubinaat',
  gescheiden: 'Gescheiden',
}

const GENDER_LABELS: Record<string, string> = {
  man: 'Man',
  vrouw: 'Vrouw',
}

const INTERVIEW_LABELS: Record<InterviewType, string> = {
  general: 'Sollicitatiegesprek (algemeen)',
  work_experience: 'Job interview (werkervaring)',
  client: 'Klantgesprek',
  medical: 'Medische keuring',
  second_terms: 'Tweede gesprek',
}

const STATUS_FLOW: ApplicationStatus[] = ['new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding', 'active']

function ageFromIso(iso: string | null): string | undefined {
  if (!iso) return undefined
  const dob = new Date(iso)
  if (Number.isNaN(dob.getTime())) return undefined
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--
  return `${age} jaar`
}

export function ProfileSketch({
  application,
  documents,
  interviews,
  interviewQuestions,
  referenceChecks,
  contracts,
  emergencyContacts,
  onboardingSteps,
  onboardingProgress,
  shareableClients,
  shares,
  statusHistory,
  dossierItems,
  preEmployment,
  trainingCatalog,
  trainingProgress,
}: {
  application: ApplicationWithCandidate
  documents: ApplicationDocument[]
  interviews: Interview[]
  interviewQuestions: InterviewQuestion[]
  referenceChecks: ReferenceCheck[]
  contracts: EmploymentContract[]
  emergencyContacts: EmergencyContact[]
  onboardingSteps: OnboardingStepTemplate[]
  onboardingProgress: OnboardingProgressRow[]
  shareableClients: Client[]
  shares: (ClientCandidateShareRow & { client: Client })[]
  statusHistory: ApplicationStatusHistoryRow[]
  dossierItems: DossierItem[]
  preEmployment: { items: PreEmploymentItem[]; ready: boolean }
  trainingCatalog: Training[]
  trainingProgress: (CandidateTrainingProgressRow & { training: Training })[]
}) {
  const { candidate } = application
  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const currentIndex = STATUS_FLOW.indexOf(application.status)
  const nextStatus =
    currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 && application.status !== 'rejected'
      ? STATUS_FLOW[currentIndex + 1]
      : null
  const location = candidate.residence || candidate.district || null
  const scoredInterviews = interviews.filter((i) => i.averageScore !== null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Sollicitatie details</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Inzicht in sollicitatie en proces</p>
        </div>
        <StatusActions applicationId={application.id} currentStatus={application.status} nextStatus={nextStatus} layout="inline" />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar name={fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-semibold text-foreground">{fullName}</h2>
            <p className="text-sm text-foreground">
              {application.positionApplied} <span className="text-muted-foreground">· {application.company.name}</span>
            </p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
              <span>{candidate.email || 'geen e-mail'}</span>
              <span>{candidate.phone || 'geen telefoon'}</span>
              {location && <span>{location}</span>}
              <span>Registratienr {registrationLabel(candidate)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={`/admin/applications/${application.id}/cv`} target="_blank" rel="noopener noreferrer" />}
            >
              <FileText className="size-4" />
              CV bekijken
            </Button>
            <StatusBadge status={application.status} className="h-7 px-3 text-sm" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Tabs defaultValue="overzicht">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
            <TabsTrigger value="profiel">Profiel</TabsTrigger>
            <TabsTrigger value="interviews">Interviews ({interviews.length})</TabsTrigger>
            <TabsTrigger value="antecedenten">Antecedenten ({referenceChecks.length})</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="trainingen">Trainingen ({trainingProgress.length})</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
            <TabsTrigger value="dossier">Dossier</TabsTrigger>
            <TabsTrigger value="documenten">Documenten ({documents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overzicht" className="space-y-6 pt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Sollicitatie informatie</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <Row label="Vacature" value={application.positionApplied} />
                    <Row label="Bedrijf" value={application.company.name} />
                    <Row label="Sollicitatiedatum" value={formatDate(application.createdAt)} />
                    <Row label="Status" value={<StatusBadge status={application.status} />} />
                    <Row label="Bron" value={application.source === 'digitized_paper' ? 'Handgeschreven formulier' : 'Online formulier'} />
                    <Row label="Locatie" value={location} />
                    <Row label="Referentie" value={registrationLabel(candidate)} />
                  </dl>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Processtappen</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProcessSteps application={application} history={statusHistory} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Persoonsgegevens</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <Row label="Volledige naam" value={`${candidate.lastName}, ${candidate.firstName}`} />
                    <Row label="Leeftijd" value={ageFromIso(candidate.dateOfBirth)} />
                    <Row label="Locatie" value={[candidate.residence, candidate.district].filter(Boolean).join(', ') || null} />
                    <Row label="Nationaliteit" value={candidate.nationality} />
                    <Row
                      label="Rijbewijs"
                      value={
                        candidate.hasDriversLicense === null
                          ? undefined
                          : candidate.hasDriversLicense
                            ? `Ja — categorie ${candidate.driversLicenseCategory || '?'}`
                            : 'Nee'
                      }
                    />
                    <Row label="Beschikbaarheid" value={candidate.availabilityDate ? formatDate(candidate.availabilityDate) : 'Per direct'} />
                  </dl>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Vaardigheden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.skills.length === 0 && scoredInterviews.length === 0 && candidate.certifications.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nog geen vaardigheden of interviewscores vastgelegd.</p>
                  )}
                  {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#1c9848]/12 px-2.5 py-0.5 text-xs font-semibold text-[#146d34]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {scoredInterviews.length > 0 && (
                    <ul className="space-y-3">
                      {scoredInterviews.map((interview) => {
                        const score = Number(interview.averageScore)
                        const pct = Math.max(0, Math.min(100, Math.round((score / 10) * 100)))
                        return (
                          <li key={interview.id} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground">{INTERVIEW_LABELS[interview.type]}</span>
                              <span className="font-semibold tabular-nums text-foreground">{pct}%</span>
                            </div>
                            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-green),var(--color-brand-lime))]" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              gemiddelde score {score.toFixed(1)} van 10 · {formatDate(interview.conductedAt)}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {candidate.certifications.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Certificaten</p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.certifications.map((cert) => (
                          <span key={cert} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profiel" className="space-y-6 pt-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <Field label="Registratienummer" value={registrationLabel(candidate)} />
                  <Field label="E-mail" value={candidate.email} />
                  <Field label="Telefoon" value={candidate.phone} />
                  <Field label="Geboortedatum" value={formatDate(candidate.dateOfBirth)} />
                  <Field label="Geboorteplaats" value={candidate.birthPlace} />
                  <Field label="ID-nummer" value={candidate.idNumber} />
                  <Field label="Nationaliteit" value={candidate.nationality} />
                  <Field label="Burgerlijke staat" value={MARITAL_STATUS_LABELS[candidate.maritalStatus ?? '']} />
                  <Field label="Geslacht" value={GENDER_LABELS[candidate.gender ?? '']} />
                  <Field label="Godsdienst" value={candidate.religion} />
                  <Field label="Bevolkingsgroep" value={candidate.ethnicGroup} />
                  <Field label="Jaren ervaring" value={candidate.yearsExperience?.toString()} />
                  <Field label="Adres" value={candidate.address} />
                  <Field label="Woonplaats" value={candidate.residence} />
                  <Field label="District" value={candidate.district} />
                  <Field label="Afkomstig van het dorp" value={candidate.originVillage} />
                  <Field label="Traditioneel gezag" value={candidate.traditionalAuthority} />
                  <Field label="Huisarts" value={candidate.generalPractitioner} />
                  <Field label="Datum bewijs goed gedrag" value={formatDate(candidate.policeClearanceDate)} />
                  <Field
                    label="Justitiecontact"
                    value={
                      candidate.hasJusticeRecord === null
                        ? undefined
                        : candidate.hasJusticeRecord
                          ? `Ja — ${candidate.justiceRecordReason || 'geen toelichting'}`
                          : 'Nee'
                    }
                  />
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
                  <Field label="Beschikbaar vanaf" value={formatDate(candidate.availabilityDate)} />
                  <Field label="Bankrekening" value={candidate.bankAccountNumber} />
                  <Field label="Bank" value={candidate.bankName} />
                  <Field
                    label="Familielid werkzaam bij RGM"
                    value={
                      candidate.relatedToStaffMember === null
                        ? undefined
                        : candidate.relatedToStaffMember
                          ? `Ja — ${candidate.relatedToStaffMemberDetails || 'geen toelichting'}`
                          : 'Nee'
                    }
                  />
                  <Field label="Bron" value={application.source === 'digitized_paper' ? 'Handgeschreven (gedigitaliseerd)' : 'Online formulier'} />
                  <Field label="Datum binnengekomen" value={formatDate(application.createdAt)} />
                </dl>

                {coiSummaryLines(candidate.communityOfInterest).length > 0 && (
                  <Section title="Local Community of Interest (RGM)">
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground">
                      {coiSummaryLines(candidate.communityOfInterest).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </Section>
                )}
                {application.coverNote && (
                  <Section title="Motivatie">
                    <p className="text-sm text-foreground">{application.coverNote}</p>
                  </Section>
                )}
                {candidate.lastJobDescription && (
                  <Section title="Laatste functie/baan">
                    <p className="text-sm text-foreground">{candidate.lastJobDescription}</p>
                    {(candidate.lastSupervisorName || candidate.lastSupervisorContact) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Supervisor: {candidate.lastSupervisorName || '—'}
                        {candidate.lastSupervisorContact ? ` (${candidate.lastSupervisorContact})` : ''}
                      </p>
                    )}
                  </Section>
                )}
                {candidate.personalCompetencies && (
                  <Section title="Persoonlijke competenties">
                    <p className="text-sm text-foreground">{candidate.personalCompetencies}</p>
                  </Section>
                )}
                {candidate.languageSkills && (
                  <Section title="Taalvaardigheid">
                    <p className="text-sm text-foreground">{candidate.languageSkills}</p>
                  </Section>
                )}
              </CardContent>
            </Card>

            {candidate.education.length > 0 && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Opleiding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidate.education.map((entry, i) => (
                    <p key={i} className="text-sm text-foreground">
                      {entry.level}
                      {entry.fieldOfStudy ? ` — ${entry.fieldOfStudy}` : ''}{' '}
                      <span className="text-xs text-muted-foreground">({entry.completed ? 'afgerond' : 'niet afgerond'})</span>
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {candidate.priorTrainings.length > 0 && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Eerder gevolgde trainingen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidate.priorTrainings.map((entry, i) => (
                    <p key={i} className="text-sm text-foreground">
                      {entry.title}
                      {entry.kind ? ` (${entry.kind})` : ''}
                      {entry.period ? ` — ${entry.period}` : ''}{' '}
                      <span className="text-xs text-muted-foreground">({entry.completed ? 'afgerond' : 'niet afgerond'})</span>
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {candidate.workHistory.length > 0 && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Werkervaring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.workHistory.map((entry, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium text-foreground">
                        {entry.company}
                        {entry.role ? ` — ${entry.role}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.period}
                        {entry.salary ? ` · salaris: ${entry.salary}` : ''}
                        {entry.reasonForLeaving ? ` · reden vertrek: ${entry.reasonForLeaving}` : ''}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4 pt-4">
            <InterviewsList interviews={interviews} />
            <InterviewForm applicationId={application.id} questions={interviewQuestions} />
          </TabsContent>

          <TabsContent value="antecedenten" className="space-y-4 pt-4">
            <ReferenceChecksList checks={referenceChecks} applicationId={application.id} />
            <ReferenceCheckForm
              applicationId={application.id}
              candidateName={fullName}
              defaults={{
                refereeName: candidate.lastSupervisorName,
                refereePhone: candidate.lastSupervisorContact,
                refereeCompany: candidate.workHistory[0]?.company ?? null,
              }}
            />
          </TabsContent>

          <TabsContent value="onboarding" className="pt-4">
            {onboardingSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen onboarding-stappen ingesteld.</p>
            ) : (
              <OnboardingChecklist applicationId={application.id} steps={onboardingSteps} progress={onboardingProgress} />
            )}
          </TabsContent>

          <TabsContent value="trainingen" className="pt-4">
            <CandidateTrainings applicationId={application.id} catalog={trainingCatalog} progress={trainingProgress} />
          </TabsContent>

          <TabsContent value="contract" className="space-y-4 pt-4">
            <ContractsList contracts={contracts} applicationId={application.id} />
            <ContractForm applicationId={application.id} />
            <EmergencyContactsCard candidateId={application.candidateId} applicationId={application.id} contacts={emergencyContacts} />
          </TabsContent>

          <TabsContent value="dossier" className="pt-4">
            <DossierTab applicationId={application.id} items={dossierItems} preEmployment={preEmployment} />
          </TabsContent>

          <TabsContent value="documenten" className="pt-4">
            {documents.length === 0 && (
              <p className="text-sm text-muted-foreground">Geen documenten geüpload. Voeg stukken toe via het tabblad Dossier.</p>
            )}
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/8">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{DOCUMENT_LABELS[doc.kind]}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileName} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" />}>
                    <ExternalLink className="size-3.5" />
                    Bekijken
                  </Button>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <WhatsAppActions
            phone={candidate.phone}
            context={{ firstName: candidate.firstName, companyName: application.company.name, positionApplied: application.positionApplied }}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm tracking-wide text-muted-foreground uppercase">Delen met client</CardTitle>
            </CardHeader>
            <CardContent>
              <ShareWithClient applicationId={application.id} shareableClients={shareableClients} shares={shares} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/** Tijdlijn van de pipeline: bereikte stappen met datum, huidige stap "Actief", de rest open. */
function ProcessSteps({ application, history }: { application: ApplicationWithCandidate; history: ApplicationStatusHistoryRow[] }) {
  const reachedAt = new Map<ApplicationStatus, Date>([['new', application.createdAt]])
  for (const row of history) if (!reachedAt.has(row.toStatus)) reachedAt.set(row.toStatus, row.createdAt)

  const closed = application.status === 'rejected' || application.status === 'withdrawn'
  const steps: ApplicationStatus[] = closed ? [...STATUS_FLOW.filter((s) => reachedAt.has(s)), application.status] : STATUS_FLOW
  const currentIndex = steps.indexOf(application.status)

  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-6">
      {steps.map((status, i) => {
        const date = reachedAt.get(status)
        const done = i < currentIndex
        const current = i === currentIndex
        const failed = current && closed
        return (
          <li key={status} className="relative">
            <span
              className={cn(
                'absolute top-0.5 -left-[31px] flex size-4 items-center justify-center rounded-full ring-4 ring-card',
                done && 'bg-[var(--color-brand-green)] text-white',
                current && !failed && 'bg-[var(--color-brand-green)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-brand-green)_25%,transparent)]',
                failed && 'bg-destructive',
                !done && !current && 'bg-muted'
              )}
            >
              {done && <Check className="size-3" strokeWidth={3} />}
            </span>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className={cn(done || current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {status === 'new' ? 'Sollicitatie ontvangen' : APPLICATION_STATUS_LABELS[status]}
              </span>
              {current ? (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', failed ? 'bg-destructive/10 text-destructive' : 'bg-[#1c9848]/12 text-[#146d34]')}>
                  {failed ? APPLICATION_STATUS_LABELS[status] : 'Actief'}
                </span>
              ) : date ? (
                <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-foreground">{value || '—'}</dd>
    </div>
  )
}
