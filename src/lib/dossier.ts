/**
 * dossier.ts
 * WAT:    Berekent de "Index Personeelsdossier" (PGC-HR-F-0508-04, 11 onderdelen) en de vier
 *         verplichte "client pre-employment"-stukken uit bestaande data van één sollicitatie.
 * WAAROM: De index is geen apart opgeslagen formulier maar een weergave — wat aanwezig is staat al
 *         in documenten, interviews, referentiechecks, onboarding en contracten. Zuivere functie
 *         (geen DB-toegang) zodat de regels op één plek staan en los te testen zijn.
 */

import { INDUCTION_STEP_TITLES } from '@/constants/onboarding-steps'
import type {
  ApplicationDocument,
  Candidate,
  DocumentKind,
  EmergencyContact,
  EmploymentContract,
  Interview,
  OnboardingStepStatus,
  OnboardingStepTemplate,
  ReferenceCheck,
} from '@/types/database'

export type DossierState = 'done' | 'partial' | 'missing' | 'not_applicable'

export interface DossierItem {
  no: string
  title: string
  state: DossierState
  /** Datum waarop het stuk in het dossier kwam (laatste relevante gebeurtenis). */
  date: Date | null
  hint?: string
  children?: DossierItem[]
}

export interface DossierInput {
  candidate: Candidate
  documents: ApplicationDocument[]
  interviews: Interview[]
  referenceChecks: ReferenceCheck[]
  contracts: EmploymentContract[]
  emergencyContacts: EmergencyContact[]
  onboardingSteps: OnboardingStepTemplate[]
  onboardingProgress: { stepTemplateId: string; status: OnboardingStepStatus; completedAt?: Date | null }[]
}

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  cv: 'CV',
  handwritten_scan: 'Scan handgeschreven formulier',
  id_document: 'ID-document',
  certificate: 'Training certificaat',
  police_clearance: 'Bewijs van goed gedrag',
  drivers_license: 'Rijbewijs',
  diploma: "Diploma / cijferlijst",
  photo_family_docs: 'Pasfoto / uittreksel / familieboek',
  medical_certificate: 'Medische keuring certificaat',
  sor_declaration: 'SOR-verklaring',
  medical_insurance: 'Aanvraag medische verzekering',
  signed_contract: 'Getekende arbeidsovereenkomst',
  other: 'Overig',
}

function latest(dates: (Date | null | undefined)[]): Date | null {
  const valid = dates.filter((d): d is Date => d instanceof Date)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b))
}

function docItem(no: string, title: string, documents: ApplicationDocument[], kind: DocumentKind): DossierItem {
  const matches = documents.filter((d) => d.kind === kind)
  return {
    no,
    title,
    state: matches.length > 0 ? 'done' : 'missing',
    date: latest(matches.map((d) => d.createdAt)),
  }
}

export function buildDossierIndex(input: DossierInput): DossierItem[] {
  const { candidate, documents, interviews, referenceChecks, contracts, emergencyContacts } = input

  const registrationChildren: DossierItem[] = [
    docItem('', 'Goedgedrag', documents, 'police_clearance'),
    docItem('', 'Kopie ID-kaart', documents, 'id_document'),
    candidate.hasDriversLicense === false
      ? { no: '', title: 'Kopie rijbewijs', state: 'not_applicable', date: null, hint: 'Kandidaat heeft geen rijbewijs' }
      : docItem('', 'Kopie rijbewijs', documents, 'drivers_license'),
    docItem('', "Kopie diploma's en cijferlijsten", documents, 'diploma'),
    docItem('', 'Kopie training certificaten', documents, 'certificate'),
    docItem('', 'Pasfoto, uittreksel, kopie familieboek', documents, 'photo_family_docs'),
  ]
  const required = registrationChildren.filter((c) => c.state !== 'not_applicable')
  const doneCount = required.filter((c) => c.state === 'done').length

  const general = interviews.filter((i) => i.type === 'general')
  const workExperience = interviews.filter((i) => i.type === 'work_experience')

  const hasCvData = candidate.workHistory.length > 0 || candidate.education.length > 0
  const cvDocs = documents.filter((d) => d.kind === 'cv')

  const inductionTitles = Object.values(INDUCTION_STEP_TITLES)
  const inductionSteps = input.onboardingSteps.filter((s) => (inductionTitles as string[]).includes(s.title))
  const progressByStep = new Map(input.onboardingProgress.map((p) => [p.stepTemplateId, p]))
  const inductionDone = inductionSteps.filter((s) => progressByStep.get(s.id)?.status === 'done')
  const inductionState: DossierState =
    inductionSteps.length === 0
      ? 'missing'
      : inductionDone.length === inductionSteps.length
        ? 'done'
        : inductionDone.length > 0
          ? 'partial'
          : 'missing'

  const basisHasContract = contracts.length > 0
  const basisHasBank = Boolean(contracts.find((c) => c.bankAccount) || candidate.bankAccountNumber)
  const basisHasEmergency = emergencyContacts.length > 0
  const basisChecks = [basisHasContract, basisHasBank, basisHasEmergency]
  const basisHint = [
    !basisHasContract && 'contract/uurloon',
    !basisHasBank && 'bankrekening',
    !basisHasEmergency && 'noodcontact',
  ].filter(Boolean)

  const signed = documents.filter((d) => d.kind === 'signed_contract')

  return [
    {
      no: '1',
      title: 'Registratieformulier',
      state: doneCount === required.length ? 'done' : 'partial',
      date: candidate.createdAt,
      hint: `${doneCount} van ${required.length} bijlagen aanwezig`,
      children: registrationChildren,
    },
    {
      no: '2',
      title: 'Vragenlijst sollicitatiegesprek',
      state: general.length > 0 ? 'done' : 'missing',
      date: latest(general.map((i) => i.conductedAt ?? i.createdAt)),
    },
    {
      no: '3',
      title: 'Vragenlijst job interview',
      state: workExperience.length > 0 ? 'done' : 'missing',
      date: latest(workExperience.map((i) => i.conductedAt ?? i.createdAt)),
    },
    {
      no: '4',
      title: 'Vragenlijst antecedentenonderzoek',
      state: referenceChecks.length > 0 ? 'done' : 'missing',
      date: latest(referenceChecks.map((r) => r.checkedAt)),
    },
    {
      no: '5',
      title: 'Curriculum vitae formulier',
      state: hasCvData || cvDocs.length > 0 ? 'done' : 'missing',
      date: latest(cvDocs.map((d) => d.createdAt)) ?? (hasCvData ? candidate.updatedAt : null),
      hint: hasCvData ? 'CV wordt gegenereerd uit het kandidaatprofiel' : undefined,
    },
    {
      no: '6',
      title: 'Inductie formulier',
      state: inductionState,
      date: latest(inductionDone.map((s) => progressByStep.get(s.id)?.completedAt ?? null)),
      hint: inductionSteps.length
        ? `${inductionDone.length} van ${inductionSteps.length} inducties afgerond`
        : 'Inductie-stappen ontbreken — draai `npm run db:seed`',
    },
    {
      no: '7',
      title: 'Basisgegevens nieuwe werknemer',
      state: basisChecks.every(Boolean) ? 'done' : basisChecks.some(Boolean) ? 'partial' : 'missing',
      date: latest(contracts.map((c) => c.createdAt)),
      hint: basisHint.length ? `Nog invullen: ${basisHint.join(', ')}` : undefined,
    },
    {
      no: '8',
      title: 'Arbeidsovereenkomst',
      state: signed.length > 0 ? 'done' : contracts.length > 0 ? 'partial' : 'missing',
      date: latest(signed.map((d) => d.createdAt)) ?? latest(contracts.map((c) => c.createdAt)),
      hint: signed.length === 0 && contracts.length > 0 ? 'Contract vastgelegd, getekend exemplaar nog niet geüpload' : undefined,
    },
    docItem('9', 'Medische keuring certificaat', documents, 'medical_certificate'),
    docItem('10', 'SOR verzekering verklaring', documents, 'sor_declaration'),
    docItem('11', 'Aanvraag Medische verzekering', documents, 'medical_insurance'),
  ]
}

export interface PreEmploymentItem {
  title: string
  state: 'done' | 'missing'
  hint?: string
}

/**
 * De vier stukken die de client (RGM) eist voor "Client induction training aanvragen"
 * (PGC-HR-PR-0501-05): medical certificate, accident insurance (SOR), valid police clearance,
 * valid identification. De geldigheidsduur van goedgedrag/ID staat niet in de HR-documenten —
 * de app toont alleen de datum en laat HR de geldigheid beoordelen.
 */
export function buildPreEmploymentChecklist(
  candidate: Candidate,
  documents: ApplicationDocument[]
): { items: PreEmploymentItem[]; ready: boolean } {
  const has = (kind: DocumentKind) => documents.some((d) => d.kind === kind)
  const items: PreEmploymentItem[] = [
    { title: 'Medical certificate (per functie)', state: has('medical_certificate') ? 'done' : 'missing', hint: 'Voor emergency één maand geldig' },
    { title: 'Accident Insurance (SOR), op naam van de medewerker', state: has('sor_declaration') ? 'done' : 'missing' },
    {
      title: 'Valid Police Clearance',
      state: has('police_clearance') ? 'done' : 'missing',
      hint: candidate.policeClearanceDate ? `Datum goedgedrag: ${candidate.policeClearanceDate} — geldigheid controleren` : 'Datum goedgedrag nog niet vastgelegd',
    },
    { title: 'Valid Identification', state: has('id_document') ? 'done' : 'missing', hint: 'ID-kaart — geldigheid controleren' },
  ]
  return { items, ready: items.every((i) => i.state === 'done') }
}
