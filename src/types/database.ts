/**
 * database.ts
 * WAT:    Centrale TypeScript-types voor het datamodel — afgeleid van drizzle/schema.ts
 *         zodat er één bron van waarheid is tussen DB-schema en de rest van de app.
 */

import type { Application, Candidate, ClientCandidateShareRow, Company } from '../../drizzle/schema'

export type {
  ApplicationSource,
  ApplicationStatus,
  Candidate,
  Company,
  CompanyKind,
  DocumentKind,
  Application,
  ApplicationDocument,
  ClientCandidateShareRow,
  Profile,
  UserRole,
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
