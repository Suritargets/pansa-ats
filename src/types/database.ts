/**
 * database.ts
 * WAT:    Centrale TypeScript-types voor het datamodel — afgeleid van drizzle/schema.ts
 *         zodat er één bron van waarheid is tussen DB-schema en de rest van de app.
 */

import type { Application, Candidate, ClientCandidateShareRow, Company } from '../../drizzle/schema'

export type {
  ApiKey,
  ApiKeyScope,
  ApplicationSource,
  ApplicationStatus,
  AuditLogRow,
  NewAuditLogRow,
  ChatKbEntry,
  JobScopeEntry,
  WebhookEndpoint,
  WebhookEvent,
  Candidate,
  Client,
  ClientCandidateShareRow,
  ClientStatus,
  ClientVacancyRequest,
  Company,
  CompanyKind,
  ContractStage,
  ContractStatus,
  DocumentKind,
  Application,
  ApplicationDocument,
  EducationEntry,
  EmergencyContact,
  EmploymentContract,
  Gender,
  Interview,
  InterviewQuestion,
  InterviewType,
  JobBranche,
  JobCategory,
  JobLevel,
  MaritalStatus,
  PriorTrainingEntry,
  WorkHistoryEntry,
  OnboardingProgressRow,
  OnboardingStepStatus,
  OnboardingStepTemplate,
  PayrollExportBatch,
  PayrollExportItem,
  Profile,
  Supplier,
  SupplierKind,
  Training,
  CandidateTrainingProgressRow,
  TrainingProgressStatus,
  UserRole,
  VacancyRequestStatus,
} from '../../drizzle/schema'

export interface ApplicationWithCandidate extends Application {
  candidate: Candidate
  company: Company
}

export interface SharedApplication extends ApplicationWithCandidate {
  share: ClientCandidateShareRow
}

export const APPLICATION_STATUS_LABELS: Record<Application['status'], string> = {
  new: 'Nieuw',
  in_review: 'In beoordeling',
  shortlisted: 'Shortlist',
  interview: 'Gesprek',
  offer: 'Aanbod',
  onboarding: 'Onboarding',
  active: 'Actief geplaatst',
  rejected: 'Afgewezen',
  withdrawn: 'Ingetrokken',
}
