import { describe, expect, it } from 'vitest'
import { buildDossierIndex, buildPreEmploymentChecklist, type DossierInput, type DossierItem } from './dossier'
import { INDUCTION_STEP_TITLES } from '@/constants/onboarding-steps'
import type {
  ApplicationDocument,
  Candidate,
  DocumentKind,
  EmergencyContact,
  EmploymentContract,
  Interview,
  InterviewType,
  OnboardingStepTemplate,
  ReferenceCheck,
} from '@/types/database'

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'cand-1',
    registrationNumber: null,
    registrationSeq: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: null,
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
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function document(kind: DocumentKind, overrides: Partial<ApplicationDocument> = {}): ApplicationDocument {
  return {
    id: `doc-${kind}`,
    applicationId: 'app-1',
    kind,
    storagePath: `path/${kind}`,
    fileName: `${kind}.pdf`,
    uploadedBy: null,
    createdAt: new Date('2026-02-01'),
    ...overrides,
  }
}

function interview(type: InterviewType, overrides: Partial<Interview> = {}): Interview {
  return {
    id: `iv-${type}`,
    applicationId: 'app-1',
    type,
    conductedBy: null,
    conductedAt: new Date('2026-02-02'),
    questions: null,
    totalScore: null,
    averageScore: null,
    notes: null,
    createdAt: new Date('2026-02-02'),
    ...overrides,
  }
}

function referenceCheck(overrides: Partial<ReferenceCheck> = {}): ReferenceCheck {
  return {
    id: 'ref-1',
    applicationId: 'app-1',
    refereeName: 'Supervisor',
    refereePosition: null,
    refereeCompany: null,
    refereeAddress: null,
    refereePhone: null,
    employmentDuration: null,
    reasonForLeaving: null,
    department: null,
    positionsHeld: null,
    oneWord: null,
    oneWordReason: null,
    workAttitude: null,
    wouldRehire: null,
    notes: null,
    checkedBy: null,
    checkedAt: new Date('2026-02-03'),
    ...overrides,
  }
}

function contract(overrides: Partial<EmploymentContract> = {}): EmploymentContract {
  return {
    id: 'contract-1',
    applicationId: 'app-1',
    stage: 'probation_2m',
    status: 'draft',
    startDate: '2026-02-01',
    endDate: null,
    hourlyWage: null,
    badgeNumber: null,
    badgeExpiryDate: null,
    department: null,
    jobLevel: null,
    projectLocation: null,
    bankAccount: null,
    bankName: null,
    probationWeek4Notes: null,
    probationWeek8Notes: null,
    createdBy: null,
    createdAt: new Date('2026-02-01'),
    ...overrides,
  }
}

function emergencyContact(overrides: Partial<EmergencyContact> = {}): EmergencyContact {
  return {
    id: 'ec-1',
    candidateId: 'cand-1',
    name: 'Next of Kin',
    relationship: null,
    phone: null,
    address: null,
    priority: 1,
    createdAt: new Date('2026-01-05'),
    ...overrides,
  }
}

function stepTemplate(title: string, overrides: Partial<OnboardingStepTemplate> = {}): OnboardingStepTemplate {
  return {
    id: `step-${title}`,
    companyId: null,
    stepOrder: 0,
    title,
    description: null,
    ...overrides,
  }
}

const emptyInput: DossierInput = {
  candidate: candidate(),
  documents: [],
  interviews: [],
  referenceChecks: [],
  contracts: [],
  emergencyContacts: [],
  onboardingSteps: [],
  onboardingProgress: [],
}

function findItem(items: DossierItem[], no: string): DossierItem {
  const item = items.find((i) => i.no === no)
  if (!item) throw new Error(`Dossier item ${no} not found`)
  return item
}

describe('buildDossierIndex — item 1: registratieformulier', () => {
  it('is missing (partial, 0 of n) with no attachments at all', () => {
    const item = findItem(buildDossierIndex(emptyInput), '1')
    expect(item.state).toBe('partial')
    expect(item.hint).toBe('0 van 6 bijlagen aanwezig')
  })

  it("treats 'kopie rijbewijs' as not applicable when the candidate has no licence, and excludes it from the count", () => {
    const items = buildDossierIndex({
      ...emptyInput,
      candidate: candidate({ hasDriversLicense: false }),
      documents: [
        document('police_clearance'),
        document('id_document'),
        document('diploma'),
        document('certificate'),
        document('photo_family_docs'),
      ],
    })
    const item = findItem(items, '1')
    const license = item.children?.find((c) => c.title === 'Kopie rijbewijs')
    expect(license?.state).toBe('not_applicable')
    expect(item.hint).toBe('5 van 5 bijlagen aanwezig')
    expect(item.state).toBe('done')
  })

  it('is done once every required attachment (including a licence copy) is present', () => {
    const items = buildDossierIndex({
      ...emptyInput,
      candidate: candidate({ hasDriversLicense: true }),
      documents: [
        document('police_clearance'),
        document('id_document'),
        document('drivers_license'),
        document('diploma'),
        document('certificate'),
        document('photo_family_docs'),
      ],
    })
    expect(findItem(items, '1').state).toBe('done')
  })
})

describe('buildDossierIndex — interview and reference items', () => {
  it('reports item 2/3 missing without matching interview types', () => {
    const items = buildDossierIndex(emptyInput)
    expect(findItem(items, '2').state).toBe('missing')
    expect(findItem(items, '3').state).toBe('missing')
  })

  it('reports item 2 done only from a general interview, independent of item 3', () => {
    const items = buildDossierIndex({ ...emptyInput, interviews: [interview('general')] })
    expect(findItem(items, '2').state).toBe('done')
    expect(findItem(items, '3').state).toBe('missing')
  })

  it('reports item 4 done once a reference check exists', () => {
    const items = buildDossierIndex({ ...emptyInput, referenceChecks: [referenceCheck()] })
    expect(findItem(items, '4').state).toBe('done')
  })
})

describe('buildDossierIndex — item 5: curriculum vitae', () => {
  it('is missing without CV data or a CV document', () => {
    expect(findItem(buildDossierIndex(emptyInput), '5').state).toBe('missing')
  })

  it('is done from profile work history alone, with an explanatory hint', () => {
    const items = buildDossierIndex({
      ...emptyInput,
      candidate: candidate({ workHistory: [{ company: 'Acme', role: 'Operator', period: '2020-2022' }] }),
    })
    const item = findItem(items, '5')
    expect(item.state).toBe('done')
    expect(item.hint).toMatch(/kandidaatprofiel/)
  })

  it('is done from an uploaded CV document alone', () => {
    const items = buildDossierIndex({ ...emptyInput, documents: [document('cv')] })
    expect(findItem(items, '5').state).toBe('done')
  })
})

describe('buildDossierIndex — item 6: inductie', () => {
  const steps = Object.values(INDUCTION_STEP_TITLES).map((title) => stepTemplate(title))

  it('is missing when the induction step templates have not been seeded', () => {
    const item = findItem(buildDossierIndex(emptyInput), '6')
    expect(item.state).toBe('missing')
    expect(item.hint).toMatch(/db:seed/)
  })

  it('is missing when seeded but none are completed', () => {
    const item = findItem(buildDossierIndex({ ...emptyInput, onboardingSteps: steps }), '6')
    expect(item.state).toBe('missing')
    expect(item.hint).toBe('0 van 4 inducties afgerond')
  })

  it('is partial once some, but not all, inductions are done', () => {
    const item = findItem(
      buildDossierIndex({
        ...emptyInput,
        onboardingSteps: steps,
        onboardingProgress: [{ stepTemplateId: steps[0].id, status: 'done', completedAt: new Date('2026-03-01') }],
      }),
      '6'
    )
    expect(item.state).toBe('partial')
    expect(item.hint).toBe('1 van 4 inducties afgerond')
  })

  it('is done once all four induction steps are completed', () => {
    const item = findItem(
      buildDossierIndex({
        ...emptyInput,
        onboardingSteps: steps,
        onboardingProgress: steps.map((s) => ({ stepTemplateId: s.id, status: 'done' as const, completedAt: new Date('2026-03-01') })),
      }),
      '6'
    )
    expect(item.state).toBe('done')
  })

  it('ignores onboarding steps that are not one of the four induction titles', () => {
    const item = findItem(
      buildDossierIndex({ ...emptyInput, onboardingSteps: [stepTemplate('Bedrijfsbeleid & regels bespreken')] }),
      '6'
    )
    expect(item.hint).toMatch(/db:seed/)
  })
})

describe('buildDossierIndex — item 7: basisgegevens', () => {
  it('is missing with no contract, bank account, or emergency contact', () => {
    expect(findItem(buildDossierIndex(emptyInput), '7').state).toBe('missing')
  })

  it('is partial with only a bank account on the candidate profile', () => {
    const item = findItem(
      buildDossierIndex({ ...emptyInput, candidate: candidate({ bankAccountNumber: 'SR123' }) }),
      '7'
    )
    expect(item.state).toBe('partial')
    expect(item.hint).toBe('Nog invullen: contract/uurloon, noodcontact')
  })

  it('accepts a bank account recorded on the contract instead of the profile', () => {
    const item = findItem(
      buildDossierIndex({
        ...emptyInput,
        contracts: [contract({ bankAccount: 'SR999' })],
        emergencyContacts: [emergencyContact()],
      }),
      '7'
    )
    expect(item.state).toBe('done')
    expect(item.hint).toBeUndefined()
  })
})

describe('buildDossierIndex — item 8: arbeidsovereenkomst', () => {
  it('is missing with no contract at all', () => {
    expect(findItem(buildDossierIndex(emptyInput), '8').state).toBe('missing')
  })

  it('is partial once a contract is recorded but nothing signed is uploaded', () => {
    const item = findItem(buildDossierIndex({ ...emptyInput, contracts: [contract()] }), '8')
    expect(item.state).toBe('partial')
    expect(item.hint).toMatch(/nog niet geüpload/)
  })

  it('is done once a signed contract document is uploaded', () => {
    const item = findItem(
      buildDossierIndex({ ...emptyInput, contracts: [contract()], documents: [document('signed_contract')] }),
      '8'
    )
    expect(item.state).toBe('done')
    expect(item.hint).toBeUndefined()
  })
})

describe('buildDossierIndex — items 9-11: post-placement documents', () => {
  it.each([
    ['9', 'medical_certificate'],
    ['10', 'sor_declaration'],
    ['11', 'medical_insurance'],
  ] as const)('item %s is done only once its %s document is uploaded', (no, kind) => {
    expect(findItem(buildDossierIndex(emptyInput), no).state).toBe('missing')
    expect(findItem(buildDossierIndex({ ...emptyInput, documents: [document(kind)] }), no).state).toBe('done')
  })
})

describe('buildPreEmploymentChecklist', () => {
  it('is not ready when any of the four documents is missing', () => {
    const { items, ready } = buildPreEmploymentChecklist(candidate(), [])
    expect(ready).toBe(false)
    expect(items).toHaveLength(4)
    expect(items.every((i) => i.state === 'missing')).toBe(true)
  })

  it('is ready only once all four documents are present', () => {
    const { ready } = buildPreEmploymentChecklist(candidate(), [
      document('medical_certificate'),
      document('sor_declaration'),
      document('police_clearance'),
      document('id_document'),
    ])
    expect(ready).toBe(true)
  })

  it('surfaces the recorded police clearance date in the hint', () => {
    const { items } = buildPreEmploymentChecklist(candidate({ policeClearanceDate: '2026-01-15' }), [])
    const clearance = items.find((i) => i.title === 'Valid Police Clearance')
    expect(clearance?.hint).toContain('2026-01-15')
  })
})
