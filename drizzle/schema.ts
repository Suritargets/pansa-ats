/**
 * schema.ts
 * WAT:    Volledig datamodel voor het ATS van Pansa Group of Companies (Drizzle ORM / Neon Postgres).
 * WAAROM: Vervangt supabase/schema.sql — zelfde tabellen or fase 1 (companies, profiles,
 *         candidates, applications, application_documents, status history) en de fase 2/3
 *         tabellen (client portal, onboarding, training, payroll export) staan al klaar.
 * LET OP: `profiles` is nu de user-tabel zelf (met email + password_hash) — er is geen
 *         losse auth-provider meer (was auth.users bij Supabase).
 */

import { relations } from 'drizzle-orm'
import {
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

// --- Companies: Pansa Group + subsidiaries ---

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  kind: companyKindEnum('kind').notNull().default('subsidiary'),
  parentId: uuid('parent_id'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// --- Profiles: staff + client users (is nu ook de user-tabel voor auth) ---

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('hr_staff'),
  companyId: uuid('company_id').references(() => companies.id), // voor client-rol
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
    address: text('address'),
    idNumber: text('id_number'),
    nationality: text('nationality'),
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
      .references(() => companies.id),
    positionApplied: text('position_applied').notNull(),
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
  storagePath: text('storage_path').notNull(), // volledige Vercel Blob URL
  fileName: text('file_name').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =====================================================================
// FASE 2/3 — Client portal, onboarding, training, payroll export
// =====================================================================

export const clientCandidateShares = pgTable(
  'client_candidate_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    clientCompanyId: uuid('client_company_id')
      .notNull()
      .references(() => companies.id),
    sharedBy: uuid('shared_by').references(() => profiles.id),
    sharedAt: timestamp('shared_at', { withTimezone: true }).notNull().defaultNow(),
    clientFeedback: text('client_feedback'),
  },
  (table) => [unique().on(table.applicationId, table.clientCompanyId)]
)

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

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
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
  documents: many(applicationDocuments),
  statusHistory: many(applicationStatusHistory),
}))

export const applicationDocumentsRelations = relations(applicationDocuments, ({ one }) => ({
  application: one(applications, {
    fields: [applicationDocuments.applicationId],
    references: [applications.id],
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

// --- Types ---

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export type Candidate = typeof candidates.$inferSelect
export type NewCandidate = typeof candidates.$inferInsert

export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert

export type ApplicationDocument = typeof applicationDocuments.$inferSelect
export type NewApplicationDocument = typeof applicationDocuments.$inferInsert

export type ApplicationStatusHistoryRow = typeof applicationStatusHistory.$inferSelect

export type ClientCandidateShareRow = typeof clientCandidateShares.$inferSelect
