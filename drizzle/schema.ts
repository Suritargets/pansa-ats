/**
 * schema.ts
 * WAT:    Volledig datamodel voor het ATS van Pansa Group of Companies (Drizzle ORM / Neon Postgres).
 * WAAROM: `companies` = Pansa's eigen bedrijven (werkgever, bv. HPS/PMS). `clients` = externe
 *         klanten waar kandidaten geplaatst worden (bv. mijnbouwbedrijven als RGM) — dit was
 *         voorheen (verkeerd) samengevoegd met `companies`. `suppliers` = leveranciers/relaties
 *         (medisch, uitzendbureaus, verzekering, training, overheid).
 * LET OP: `profiles` is de user-tabel zelf (email + password_hash) — geen losse auth-provider.
 *         Drie portalen: staff (role in super_admin/hr_staff/recruiter), client (role=client,
 *         profiles.clientId), candidate (role=candidate, profiles.candidateId).
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

// --- Enums ---

export const companyKindEnum = pgEnum('company_kind', ['parent', 'subsidiary'])

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'hr_staff',
  'recruiter',
  'client',
  'candidate',
])

export const applicationSourceEnum = pgEnum('application_source', [
  'online_form',
  'digitized_paper',
])

export const applicationStatusEnum = pgEnum('application_status', [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'offer',
  'onboarding',
  'active',
  'rejected',
  'withdrawn',
])

export const documentKindEnum = pgEnum('document_kind', [
  'cv',
  'handwritten_scan',
  'id_document',
  'certificate',
  'other',
])

export const onboardingStepStatusEnum = pgEnum('onboarding_step_status', [
  'pending',
  'in_progress',
  'done',
  'skipped',
])

export const trainingProgressStatusEnum = pgEnum('training_progress_status', [
  'not_started',
  'in_progress',
  'completed',
  'failed',
])

export const payrollExportStatusEnum = pgEnum('payroll_export_status', [
  'pending',
  'exported',
  'failed',
])

export const clientStatusEnum = pgEnum('client_status', ['prospect', 'active', 'inactive'])

export const supplierKindEnum = pgEnum('supplier_kind', [
  'medical',
  'staffing',
  'insurance',
  'training',
  'government',
  'other',
])

export const jobBrancheEnum = pgEnum('job_branche', [
  'mining_operations',
  'technical_maintenance',
  'trades',
  'hospitality_camp',
  'administration_support',
  'security_safety',
  'logistics_warehouse',
])

export const jobLevelEnum = pgEnum('job_level', [
  'helper',
  'operator',
  'skilled',
  'supervisor',
  'administrative',
])

export const interviewTypeEnum = pgEnum('interview_type', [
  'general', // Vragenlijst sollicitatiegesprek — 15 vragen, scored
  'work_experience', // Vragenlijst job interview work experience — 12 open categorieën
  'client', // interview + test bij de klant
  'medical', // medische keuring
  'second_terms', // tweede gesprek — arbeidsvoorwaarden
])

export const contractStageEnum = pgEnum('contract_stage', [
  'probation_2m',
  'term_4m',
  'extension_6m',
  'extension_12m',
  'permanent',
])

export const contractStatusEnum = pgEnum('contract_status', ['draft', 'active', 'ended', 'terminated'])

export const vacancyRequestStatusEnum = pgEnum('vacancy_request_status', [
  'submitted',
  'reviewing',
  'approved',
  'fulfilled',
  'rejected',
])

export const maritalStatusEnum = pgEnum('marital_status', [
  'gehuwd',
  'ongehuwd',
  'concubinaat',
  'gescheiden',
])

export const genderEnum = pgEnum('gender', ['man', 'vrouw'])

// --- Candidate jsonb sub-shapes (opleiding, training, werkervaring — herhalende groepen) ---

export interface EducationEntry {
  level: string // opleidingsniveau
  fieldOfStudy?: string // studierichting
  completed: boolean // afgerond (diploma) vs niet afgerond (rapport)
  notes?: string
}

export interface PriorTrainingEntry {
  kind?: string // soort training
  title: string // titel van de training
  period?: string
  completed: boolean
}

export interface WorkHistoryEntry {
  period?: string
  company: string
  role?: string // functie/skills
  salary?: string // genoten salaris
  reasonForLeaving?: string
}

// --- Companies: Pansa Group + subsidiaries (werkgever) ---

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  kind: companyKindEnum('kind').notNull().default('subsidiary'),
  parentId: uuid('parent_id'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// --- Clients: externe klanten waar kandidaten geplaatst worden (bv. RGM) ---

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    industry: text('industry'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    address: text('address'),
    status: clientStatusEnum('status').notNull().default('active'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_clients_name').on(table.name)]
)

// --- Suppliers: leveranciers/relaties (medisch, uitzendbureau, verzekering, training, overheid) ---

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    kind: supplierKindEnum('kind').notNull().default('other'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    address: text('address'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_suppliers_kind').on(table.kind)]
)

// --- Job categories: de echte functielijst van het registratieformulier ---

export const jobCategories = pgTable('job_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  branche: jobBrancheEnum('branche').notNull().default('mining_operations'),
  level: jobLevelEnum('level').notNull().default('operator'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// --- Profiles: staff + client + candidate users (is de user-tabel voor auth) ---

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('hr_staff'),
  companyId: uuid('company_id').references(() => companies.id), // interne staff — thuisbedrijf
  clientId: uuid('client_id').references(() => clients.id), // voor role='client'
  candidateId: uuid('candidate_id').references(() => candidates.id), // voor role='candidate'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// --- Candidates ---

export const candidates = pgTable(
  'candidates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    dateOfBirth: text('date_of_birth'), // ISO date string (yyyy-mm-dd)
    birthPlace: text('birth_place'),
    address: text('address'),
    residence: text('residence'), // woonplaats
    district: text('district'),
    originVillage: text('origin_village'), // afkomstig van het dorp (naam)
    traditionalAuthority: text('traditional_authority'), // traditioneel gezag van het dorp
    idNumber: text('id_number'),
    nationality: text('nationality'),
    maritalStatus: maritalStatusEnum('marital_status'),
    gender: genderEnum('gender'),
    religion: text('religion'),
    ethnicGroup: text('ethnic_group'), // bevolkingsgroep
    hasJusticeRecord: boolean('has_justice_record'),
    justiceRecordReason: text('justice_record_reason'),
    hasDriversLicense: boolean('has_drivers_license'),
    driversLicenseCategory: text('drivers_license_category'),
    education: jsonb('education').$type<EducationEntry[]>().notNull().default([]),
    // kandidaat's eigen opleidingsgeschiedenis — niet te verwarren met `trainings`/
    // `candidate_training_progress`, dat is Pansa-training NA aanname.
    priorTrainings: jsonb('prior_trainings').$type<PriorTrainingEntry[]>().notNull().default([]),
    workHistory: jsonb('work_history').$type<WorkHistoryEntry[]>().notNull().default([]),
    workedSimilarCompanyBefore: boolean('worked_similar_company_before'),
    workedSimilarCompanyDetails: text('worked_similar_company_details'),
    lastJobDescription: text('last_job_description'),
    lastSupervisorName: text('last_supervisor_name'),
    lastSupervisorContact: text('last_supervisor_contact'),
    availabilityDate: text('availability_date'), // ISO date string
    bankAccountNumber: text('bank_account_number'), // girorekeningnummer
    bankName: text('bank_name'),
    skills: text('skills').array().notNull().default([]),
    certifications: text('certifications').array().notNull().default([]),
    yearsExperience: numeric('years_experience'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_candidates_name').on(table.lastName, table.firstName),
    index('idx_candidates_email').on(table.email),
  ]
)

// --- Emergency contacts: van "Basisgegevens nieuwe medewerker" (tot 3 per candidate) ---

export const emergencyContacts = pgTable(
  'emergency_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    relationship: text('relationship'),
    phone: text('phone'),
    address: text('address'),
    priority: integer('priority').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_emergency_contacts_candidate').on(table.candidateId)]
)

// --- Applications ---

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id), // werkgever (Pansa-bedrijf)
    clientId: uuid('client_id').references(() => clients.id), // geplaatst bij welke klant
    jobCategoryId: uuid('job_category_id').references(() => jobCategories.id),
    positionApplied: text('position_applied').notNull(), // vrije tekst fallback
    source: applicationSourceEnum('source').notNull().default('online_form'),
    status: applicationStatusEnum('status').notNull().default('new'),
    coverNote: text('cover_note'),
    digitizedBy: uuid('digitized_by').references(() => profiles.id),
    digitizedAt: timestamp('digitized_at', { withTimezone: true }),
    assignedRecruiter: uuid('assigned_recruiter').references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_applications_status').on(table.status),
    index('idx_applications_company').on(table.companyId),
    index('idx_applications_candidate').on(table.candidateId),
    index('idx_applications_client').on(table.clientId),
  ]
)

// --- Status history: audit trail ---

export const applicationStatusHistory = pgTable('application_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  fromStatus: applicationStatusEnum('from_status'),
  toStatus: applicationStatusEnum('to_status').notNull(),
  changedBy: uuid('changed_by').references(() => profiles.id),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// --- Documents: CV, scans, certificaten, ID ---

export const applicationDocuments = pgTable('application_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  kind: documentKindEnum('kind').notNull().default('other'),
  storagePath: text('storage_path').notNull(), // pad in de private Vercel Blob store
  fileName: text('file_name').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// --- Interviews: scorecard voor zowel het algemene als het werkervaring-gesprek ---

export const interviews = pgTable(
  'interviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    type: interviewTypeEnum('type').notNull(),
    conductedBy: uuid('conducted_by').references(() => profiles.id),
    conductedAt: timestamp('conducted_at', { withTimezone: true }),
    // [{ category: string, question?: string, answer: string, score?: number }]
    questions: jsonb('questions'),
    totalScore: numeric('total_score'),
    averageScore: numeric('average_score'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_interviews_application').on(table.applicationId)]
)

// --- Employment contracts: proeftijd -> termijn -> verlengingen ---

export const employmentContracts = pgTable(
  'employment_contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    stage: contractStageEnum('stage').notNull(),
    status: contractStatusEnum('status').notNull().default('draft'),
    startDate: text('start_date'), // ISO date string
    endDate: text('end_date'),
    hourlyWage: numeric('hourly_wage'),
    badgeNumber: text('badge_number'),
    bankAccount: text('bank_account'),
    bankName: text('bank_name'),
    probationWeek4Notes: text('probation_week4_notes'),
    probationWeek8Notes: text('probation_week8_notes'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_contracts_application').on(table.applicationId)]
)

// =====================================================================
// Client portal, onboarding, training, payroll export
// =====================================================================

export const clientCandidateShares = pgTable(
  'client_candidate_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    sharedBy: uuid('shared_by').references(() => profiles.id),
    sharedAt: timestamp('shared_at', { withTimezone: true }).notNull().defaultNow(),
    clientFeedback: text('client_feedback'),
  },
  (table) => [unique().on(table.applicationId, table.clientId)]
)

export const clientVacancyRequests = pgTable('client_vacancy_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  jobCategoryId: uuid('job_category_id').references(() => jobCategories.id),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
  status: vacancyRequestStatusEnum('status').notNull().default('submitted'),
  requestedBy: uuid('requested_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const onboardingStepTemplates = pgTable('onboarding_step_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id), // null = alle bedrijven
  stepOrder: integer('step_order').notNull(),
  title: text('title').notNull(),
  description: text('description'),
})

export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    stepTemplateId: uuid('step_template_id')
      .notNull()
      .references(() => onboardingStepTemplates.id),
    status: onboardingStepStatusEnum('status').notNull().default('pending'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    completedBy: uuid('completed_by').references(() => profiles.id),
    notes: text('notes'),
  },
  (table) => [unique().on(table.applicationId, table.stepTemplateId)]
)

export const trainings = pgTable('trainings', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  standard: text('standard'), // bv. ASME, AWS, API
  durationHours: numeric('duration_hours'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const candidateTrainingProgress = pgTable(
  'candidate_training_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    trainingId: uuid('training_id')
      .notNull()
      .references(() => trainings.id),
    status: trainingProgressStatusEnum('status').notNull().default('not_started'),
    score: numeric('score'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    notes: text('notes'),
  },
  (table) => [unique().on(table.applicationId, table.trainingId)]
)

export const payrollExportBatches = pgTable('payroll_export_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestedBy: uuid('requested_by').references(() => profiles.id),
  status: payrollExportStatusEnum('status').notNull().default('pending'),
  fileFormat: text('file_format').notNull().default('csv'),
  storagePath: text('storage_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const payrollExportItems = pgTable('payroll_export_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => payrollExportBatches.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id),
  externalEmployeeId: text('external_employee_id'),
  exportPayload: jsonb('export_payload'),
})

// --- Relations (voor db.query.* joins) ---

export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(applications),
}))

export const clientsRelations = relations(clients, ({ many }) => ({
  applications: many(applications),
  shares: many(clientCandidateShares),
  vacancyRequests: many(clientVacancyRequests),
}))

export const suppliersRelations = relations(suppliers, () => ({}))

export const jobCategoriesRelations = relations(jobCategories, ({ many }) => ({
  applications: many(applications),
  vacancyRequests: many(clientVacancyRequests),
}))

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
  emergencyContacts: many(emergencyContacts),
}))

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  candidate: one(candidates, {
    fields: [emergencyContacts.candidateId],
    references: [candidates.id],
  }),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  company: one(companies, {
    fields: [applications.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [applications.clientId],
    references: [clients.id],
  }),
  jobCategory: one(jobCategories, {
    fields: [applications.jobCategoryId],
    references: [jobCategories.id],
  }),
  documents: many(applicationDocuments),
  statusHistory: many(applicationStatusHistory),
  interviews: many(interviews),
  contracts: many(employmentContracts),
}))

export const applicationDocumentsRelations = relations(applicationDocuments, ({ one }) => ({
  application: one(applications, {
    fields: [applicationDocuments.applicationId],
    references: [applications.id],
  }),
}))

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}))

export const employmentContractsRelations = relations(employmentContracts, ({ one }) => ({
  application: one(applications, {
    fields: [employmentContracts.applicationId],
    references: [applications.id],
  }),
}))

export const clientCandidateSharesRelations = relations(clientCandidateShares, ({ one }) => ({
  application: one(applications, {
    fields: [clientCandidateShares.applicationId],
    references: [applications.id],
  }),
  client: one(clients, {
    fields: [clientCandidateShares.clientId],
    references: [clients.id],
  }),
}))

export const clientVacancyRequestsRelations = relations(clientVacancyRequests, ({ one }) => ({
  client: one(clients, {
    fields: [clientVacancyRequests.clientId],
    references: [clients.id],
  }),
  jobCategory: one(jobCategories, {
    fields: [clientVacancyRequests.jobCategoryId],
    references: [jobCategories.id],
  }),
}))

// --- Enum value types ---

export type CompanyKind = (typeof companyKindEnum.enumValues)[number]
export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type ApplicationSource = (typeof applicationSourceEnum.enumValues)[number]
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number]
export type DocumentKind = (typeof documentKindEnum.enumValues)[number]
export type OnboardingStepStatus = (typeof onboardingStepStatusEnum.enumValues)[number]
export type TrainingProgressStatus = (typeof trainingProgressStatusEnum.enumValues)[number]
export type PayrollExportStatus = (typeof payrollExportStatusEnum.enumValues)[number]
export type ClientStatus = (typeof clientStatusEnum.enumValues)[number]
export type SupplierKind = (typeof supplierKindEnum.enumValues)[number]
export type JobBranche = (typeof jobBrancheEnum.enumValues)[number]
export type JobLevel = (typeof jobLevelEnum.enumValues)[number]
export type InterviewType = (typeof interviewTypeEnum.enumValues)[number]
export type ContractStage = (typeof contractStageEnum.enumValues)[number]
export type ContractStatus = (typeof contractStatusEnum.enumValues)[number]
export type VacancyRequestStatus = (typeof vacancyRequestStatusEnum.enumValues)[number]
export type MaritalStatus = (typeof maritalStatusEnum.enumValues)[number]
export type Gender = (typeof genderEnum.enumValues)[number]

// --- Types ---

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert

export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert

export type JobCategory = typeof jobCategories.$inferSelect
export type NewJobCategory = typeof jobCategories.$inferInsert

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export type Candidate = typeof candidates.$inferSelect
export type NewCandidate = typeof candidates.$inferInsert

export type EmergencyContact = typeof emergencyContacts.$inferSelect
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert

export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert

export type ApplicationDocument = typeof applicationDocuments.$inferSelect
export type NewApplicationDocument = typeof applicationDocuments.$inferInsert

export type ApplicationStatusHistoryRow = typeof applicationStatusHistory.$inferSelect

export type Interview = typeof interviews.$inferSelect
export type NewInterview = typeof interviews.$inferInsert

export type EmploymentContract = typeof employmentContracts.$inferSelect
export type NewEmploymentContract = typeof employmentContracts.$inferInsert

export type ClientCandidateShareRow = typeof clientCandidateShares.$inferSelect

export type ClientVacancyRequest = typeof clientVacancyRequests.$inferSelect
export type NewClientVacancyRequest = typeof clientVacancyRequests.$inferInsert

export type OnboardingStepTemplate = typeof onboardingStepTemplates.$inferSelect
export type NewOnboardingStepTemplate = typeof onboardingStepTemplates.$inferInsert

export type OnboardingProgressRow = typeof onboardingProgress.$inferSelect

export type Training = typeof trainings.$inferSelect
export type NewTraining = typeof trainings.$inferInsert

export type CandidateTrainingProgressRow = typeof candidateTrainingProgress.$inferSelect

export type PayrollExportBatch = typeof payrollExportBatches.$inferSelect
export type PayrollExportItem = typeof payrollExportItems.$inferSelect
