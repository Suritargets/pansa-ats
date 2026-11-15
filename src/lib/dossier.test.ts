import { describe, expect, it } from 'vitest'
import { buildDossierIndex, buildPreEmploymentChecklist, type DossierInput } from './dossier'
import { INDUCTION_STEP_TITLES } from '@/constants/onboarding-steps'
import type {
  ApplicationDocument,
  Candidate,
  EmergencyContact,
  EmploymentContract,
  Interview,
  OnboardingStepTemplate,
  ReferenceCheck,
} from '@/types/database'

const NOW = new Date('2026-11-15T12:00:00Z')

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
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
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

function makeDocument(overrides: Partial<ApplicationDocument> = {}): ApplicationDocument {
  return {
    id: 'doc-1',
    applicationId: 'app-1',
    kind: 'other',
    storagePath: 'applications/app-1/doc-1',
    fileName: 'file.pdf',
    uploadedBy: null,
    createdAt: NOW,
    ...overrides,
  }
}

function makeInterview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: 'int-1',
    applicationId: 'app-1',
    type: 'general',
    conductedBy: null,
    conductedAt: null,
    questions: null,
    totalScore: null,
    averageScore: null,
    notes: null,
    createdAt: NOW,
    ...overrides,
  }
}

function makeReferenceCheck(overrides: Partial<ReferenceCheck> = {}): ReferenceCheck {
  return {
    id: 'ref-1',
    applicationId: 'app-1',
    refereeName: null,
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
    checkedAt: NOW,
    ...overrides,
  }
}

function makeContract(overrides: Partial<EmploymentContract> = {}): EmploymentContract {
  return {
    id: 'contract-1',
    applicationId: 'app-1',
    stage: 'probation_2m',
    status: 'active',
    startDate: null,
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
    createdAt: NOW,
    ...overrides,
  }
}

function makeEmergencyContact(overrides: Partial<EmergencyContact> = {}): EmergencyContact {
  return {
    id: 'ec-1',
    candidateId: 'cand-1',
    name: 'Next of kin',
    relationship: null,
    phone: null,
    address: null,
    priority: 1,
    createdAt: NOW,
    ...overrides,
  }
}

function makeStepTemplate(overrides: Partial<OnboardingStepTemplate> = {}): OnboardingStepTemplate {
  return {
    id: 'step-1',
    companyId: null,
    stepOrder: 0,
    title: 'Some step',
    description: null,
    ...overrides,
  }
}

function emptyInput(overrides: Partial<DossierInput> = {}): DossierInput {
  return {
    candidate: makeCandidate(),
    documents: [],
    interviews: [],
    referenceChecks: [],
    contracts: [],
    emergencyContacts: [],
    onboardingSteps: [],
    onboardingProgress: [],
    ...overrides,
  }
}

describe('buildDossierIndex — item 1: registratieformulier', () => {
  it('is "partial" with no attachments and treats the missing driver’s license as not applicable', () => {
    const [registration] = buildDossierIndex(emptyInput({ candidate: makeCandidate({ hasDriversLicense: false }) }))
    expect(registration.state).toBe('partial')
    const license = registration.children?.find((c) => c.title === 'Kopie rijbewijs')
    expect(license?.state).toBe('not_applicable')
    // not_applicable items don't count toward the "X van Y" hint
    expect(registration.hint).toBe('0 van 5 bijlagen aanwezig')
  })

  it('is "done" once every required attachment (license included) is present', () => {
    const documents: ApplicationDocument[] = [
      makeDocument({ kind: 'police_clearance' }),
      makeDocument({ kind: 'id_document' }),
      makeDocument({ kind: 'drivers_license' }),
      makeDocument({ kind: 'diploma' }),
      makeDocument({ kind: 'certificate' }),
      makeDocument({ kind: 'photo_family_docs' }),
    ]
    const [registration] = buildDossierIndex(emptyInput({ candidate: makeCandidate({ hasDriversLicense: true }), documents }))
    expect(registration.state).toBe('done')
    expect(registration.hint).toBe('6 van 6 bijlagen aanwezig')
  })
})

describe('buildDossierIndex — items 2–4: gesprekken en antecedentenonderzoek', () => {
  it('reports "missing" without any matching interview or reference check', () => {
    const items = buildDossierIndex(emptyInput())
    expect(items[1].state).toBe('missing') // algemeen gesprek
    expect(items[2].state).toBe('missing') // werkervaring gesprek
    expect(items[3].state).toBe('missing') // antecedentenonderzoek
  })

  it('is "done" once a matching interview/reference check exists, using conductedAt over createdAt for the date', () => {
    const conductedAt = new Date('2026-10-01T00:00:00Z')
    const items = buildDossierIndex(
      emptyInput({
        interviews: [makeInterview({ type: 'general', conductedAt, createdAt: NOW })],
        referenceChecks: [makeReferenceCheck({ checkedAt: conductedAt })],
      })
    )
    expect(items[1].state).toBe('done')
    expect(items[1].date).toEqual(conductedAt)
    expect(items[3].state).toBe('done')
  })
})

describe('buildDossierIndex — item 5: curriculum vitae', () => {
  it('is "missing" without CV data or a CV document', () => {
    const [, , , , cv] = buildDossierIndex(emptyInput())
    expect(cv.state).toBe('missing')
  })

  it('is "done" from profile data alone (education/work history), even without an uploaded document', () => {
    const [, , , , cv] = buildDossierIndex(
      emptyInput({ candidate: makeCandidate({ workHistory: [{ employer: 'Acme' } as never] }) })
    )
    expect(cv.state).toBe('done')
    expect(cv.hint).toBe('CV wordt gegenereerd uit het kandidaatprofiel')
  })
})

describe('buildDossierIndex — item 6: inductie', () => {
  it('is "missing" when there are no induction steps configured', () => {
    const [, , , , , induction] = buildDossierIndex(emptyInput())
    expect(induction.state).toBe('missing')
    expect(induction.hint).toMatch(/db:seed/)
  })

  it('is "partial" once some but not all of the four induction steps are done', () => {
    const steps = Object.values(INDUCTION_STEP_TITLES).map((title, i) => makeStepTemplate({ id: `step-${i}`, title }))
    const [, , , , , induction] = buildDossierIndex(
      emptyInput({
        onboardingSteps: steps,
        onboardingProgress: [{ stepTemplateId: steps[0].id, status: 'done', completedAt: NOW }],
      })
    )
    expect(induction.state).toBe('partial')
    expect(induction.hint).toBe('1 van 4 inducties afgerond')
  })

  it('is "done" once every induction step is done, and ignores non-induction steps', () => {
    const inductionSteps = Object.values(INDUCTION_STEP_TITLES).map((title, i) => makeStepTemplate({ id: `ind-${i}`, title }))
    const otherStep = makeStepTemplate({ id: 'other', title: 'PPE aanvragen' })
    const [, , , , , induction] = buildDossierIndex(
      emptyInput({
        onboardingSteps: [...inductionSteps, otherStep],
        onboardingProgress: inductionSteps.map((s) => ({ stepTemplateId: s.id, status: 'done' as const, completedAt: NOW })),
      })
    )
    expect(induction.state).toBe('done')
    expect(induction.hint).toBe('4 van 4 inducties afgerond')
  })
})

describe('buildDossierIndex — item 7: basisgegevens nieuwe werknemer', () => {
  it('is "missing" without a contract, bank account, or emergency contact', () => {
    const [, , , , , , basis] = buildDossierIndex(emptyInput())
    expect(basis.state).toBe('missing')
    expect(basis.hint).toBe('Nog invullen: contract/uurloon, bankrekening, noodcontact')
  })

  it('accepts the bank account from either the contract or the candidate profile', () => {
    const [, , , , , , basisFromContract] = buildDossierIndex(
      emptyInput({ contracts: [makeContract({ bankAccount: 'SR123' })], emergencyContacts: [makeEmergencyContact()] })
    )
    expect(basisFromContract.state).toBe('done')

    const [, , , , , , basisFromCandidate] = buildDossierIndex(
      emptyInput({
        candidate: makeCandidate({ bankAccountNumber: 'SR456' }),
        contracts: [makeContract()],
        emergencyContacts: [makeEmergencyContact()],
      })
    )
    expect(basisFromCandidate.state).toBe('done')
  })

  it('is "partial" when only some of the three checks pass', () => {
    const [, , , , , , basis] = buildDossierIndex(emptyInput({ contracts: [makeContract()] }))
    expect(basis.state).toBe('partial')
    expect(basis.hint).toBe('Nog invullen: bankrekening, noodcontact')
  })
})

describe('buildDossierIndex — item 8: arbeidsovereenkomst', () => {
  it('is "missing" without any contract', () => {
    const [, , , , , , , ao] = buildDossierIndex(emptyInput())
    expect(ao.state).toBe('missing')
  })

  it('is "partial" with a contract but no signed document', () => {
    const [, , , , , , , ao] = buildDossierIndex(emptyInput({ contracts: [makeContract()] }))
    expect(ao.state).toBe('partial')
    expect(ao.hint).toBe('Contract vastgelegd, getekend exemplaar nog niet geüpload')
  })

  it('is "done" once a signed contract document exists', () => {
    const [, , , , , , , ao] = buildDossierIndex(
      emptyInput({ contracts: [makeContract()], documents: [makeDocument({ kind: 'signed_contract' })] })
    )
    expect(ao.state).toBe('done')
    expect(ao.hint).toBeUndefined()
  })
})

describe('buildDossierIndex — items 9–11: documents gekoppeld op kind', () => {
  it('maps straight to a document presence check', () => {
    const items = buildDossierIndex(
      emptyInput({ documents: [makeDocument({ kind: 'medical_certificate' }), makeDocument({ kind: 'sor_declaration' })] })
    )
    expect(items[8].state).toBe('done') // medical_certificate
    expect(items[9].state).toBe('done') // sor_declaration
    expect(items[10].state).toBe('missing') // medical_insurance
  })
})

describe('buildPreEmploymentChecklist', () => {
  it('is not ready when any of the four client pre-employment documents are missing', () => {
    const { items, ready } = buildPreEmploymentChecklist(makeCandidate(), [])
    expect(ready).toBe(false)
    expect(items).toHaveLength(4)
    expect(items.every((i) => i.state === 'missing')).toBe(true)
  })

  it('surfaces the recorded police clearance date as a hint', () => {
    const { items } = buildPreEmploymentChecklist(makeCandidate({ policeClearanceDate: '2026-01-15' }), [])
    const clearance = items.find((i) => i.title === 'Valid Police Clearance')
    expect(clearance?.hint).toContain('2026-01-15')
  })

  it('is ready once all four required documents are present', () => {
    const documents: ApplicationDocument[] = [
      makeDocument({ kind: 'medical_certificate' }),
      makeDocument({ kind: 'sor_declaration' }),
      makeDocument({ kind: 'police_clearance' }),
      makeDocument({ kind: 'id_document' }),
    ]
    const { ready, items } = buildPreEmploymentChecklist(makeCandidate(), documents)
    expect(ready).toBe(true)
    expect(items.every((i) => i.state === 'done')).toBe(true)
  })
})
