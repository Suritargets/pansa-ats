import { describe, expect, it } from 'vitest'
import { buildDossierIndex, buildPreEmploymentChecklist, type DossierInput } from './dossier'
import type { ApplicationDocument, Candidate, DocumentKind } from '@/types/database'

const NOW = new Date(2026, 9, 23)

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'candidate-1',
    registrationNumber: null,
    registrationSeq: 1,
    firstName: 'Jan',
    lastName: 'Pansa',
    email: 'jan@example.com',
    phone: null,
    dateOfBirth: null,
    birthPlace: null,
    address: null,
    residence: null,
    district: null,
    originVillage: null,
    traditionalAuthority: null,
    idNumber: null,
    nationality: null,
    maritalStatus: null,
    gender: null,
    religion: null,
    ethnicGroup: null,
    hasJusticeRecord: null,
    justiceRecordReason: null,
    hasDriversLicense: null,
    driversLicenseCategory: null,
    policeClearanceDate: null,
    communityOfInterest: null,
    education: [],
    priorTrainings: [],
    workHistory: [],
    workedSimilarCompanyBefore: null,
    workedSimilarCompanyDetails: null,
    lastJobDescription: null,
    lastSupervisorName: null,
    lastSupervisorContact: null,
    availabilityDate: null,
    generalPractitioner: null,
    bankAccountNumber: null,
    bankName: null,
    relatedToStaffMember: null,
    relatedToStaffMemberDetails: null,
    personalCompetencies: null,
    languageSkills: null,
    skills: [],
    certifications: [],
    yearsExperience: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as unknown as Candidate
}

function makeDocument(kind: DocumentKind, overrides: Partial<ApplicationDocument> = {}): ApplicationDocument {
  return {
    id: `doc-${kind}`,
    applicationId: 'application-1',
    kind,
    storagePath: `path/${kind}`,
    fileName: `${kind}.pdf`,
    uploadedBy: null,
    createdAt: NOW,
    ...overrides,
  } as unknown as ApplicationDocument
}

const emptyInput: DossierInput = {
  candidate: makeCandidate(),
  documents: [],
  interviews: [],
  referenceChecks: [],
  contracts: [],
  emergencyContacts: [],
  onboardingSteps: [],
  onboardingProgress: [],
}

describe('buildDossierIndex', () => {
  it('marks every item missing or partial when nothing has been collected yet', () => {
    const items = buildDossierIndex(emptyInput)
    expect(items).toHaveLength(11)
    expect(items[0].state).toBe('partial') // registration form: sub-items missing but has a createdAt
    expect(items[1].state).toBe('missing') // general interview
    expect(items[8].state).toBe('missing') // medical certificate
  })

  it('treats "no driver\'s license" as not applicable instead of missing', () => {
    const items = buildDossierIndex({ ...emptyInput, candidate: makeCandidate({ hasDriversLicense: false }) })
    const license = items[0].children?.find((c) => c.title === 'Kopie rijbewijs')
    expect(license?.state).toBe('not_applicable')
    // not_applicable items are excluded from the required count, so the form is "done" if the rest are missing-free
    expect(items[0].hint).toBe('0 van 5 bijlagen aanwezig')
  })

  it('marks the registration form done once every required attachment is present', () => {
    const documents: ApplicationDocument[] = [
      makeDocument('police_clearance'),
      makeDocument('id_document'),
      makeDocument('drivers_license'),
      makeDocument('diploma'),
      makeDocument('certificate'),
      makeDocument('photo_family_docs'),
    ]
    const items = buildDossierIndex({ ...emptyInput, documents })
    expect(items[0].state).toBe('done')
    expect(items[0].hint).toBe('6 van 6 bijlagen aanwezig')
  })

  it('derives the CV item from profile data even without an uploaded document', () => {
    const items = buildDossierIndex({
      ...emptyInput,
      candidate: makeCandidate({ workHistory: [{ company: 'Acme', role: 'Operator' }] }),
    })
    expect(items[4].title).toBe('Curriculum vitae formulier')
    expect(items[4].state).toBe('done')
    expect(items[4].hint).toBe('CV wordt gegenereerd uit het kandidaatprofiel')
  })

  it('marks the employment contract partial when a contract exists but is not yet signed', () => {
    const contracts: DossierInput['contracts'] = [
      { id: 'c1', applicationId: 'application-1', stage: 'probation_2m', status: 'active', bankAccount: null, createdAt: NOW } as never,
    ]
    const items = buildDossierIndex({ ...emptyInput, contracts })
    expect(items[7].title).toBe('Arbeidsovereenkomst')
    expect(items[7].state).toBe('partial')
    expect(items[7].hint).toContain('nog niet geüpload')
  })

  it('marks the employment contract done once a signed copy is uploaded', () => {
    const contracts: DossierInput['contracts'] = [
      { id: 'c1', applicationId: 'application-1', stage: 'probation_2m', status: 'active', bankAccount: null, createdAt: NOW } as never,
    ]
    const items = buildDossierIndex({ ...emptyInput, contracts, documents: [makeDocument('signed_contract')] })
    expect(items[7].state).toBe('done')
  })

  it('reports basic-info progress across contract, bank account, and emergency contact', () => {
    const items = buildDossierIndex({
      ...emptyInput,
      contracts: [{ id: 'c1', applicationId: 'application-1', stage: 'probation_2m', status: 'active', bankAccount: null, createdAt: NOW } as never],
    })
    expect(items[6].title).toBe('Basisgegevens nieuwe werknemer')
    expect(items[6].state).toBe('partial')
    expect(items[6].hint).toBe('Nog invullen: bankrekening, noodcontact')
  })
})

describe('buildPreEmploymentChecklist', () => {
  it('is not ready when any of the four required documents is missing', () => {
    const { items, ready } = buildPreEmploymentChecklist(makeCandidate(), [])
    expect(items).toHaveLength(4)
    expect(ready).toBe(false)
    expect(items.every((i) => i.state === 'missing')).toBe(true)
  })

  it('is ready once all four documents are present', () => {
    const documents = [
      makeDocument('medical_certificate'),
      makeDocument('sor_declaration'),
      makeDocument('police_clearance'),
      makeDocument('id_document'),
    ]
    const { ready } = buildPreEmploymentChecklist(makeCandidate(), documents)
    expect(ready).toBe(true)
  })

  it('surfaces the recorded police clearance date as a hint', () => {
    const { items } = buildPreEmploymentChecklist(makeCandidate({ policeClearanceDate: '2026-01-15' }), [])
    const clearance = items.find((i) => i.title === 'Valid Police Clearance')
    expect(clearance?.hint).toContain('2026-01-15')
  })
})
