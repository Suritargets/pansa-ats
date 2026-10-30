/**
 * queries.ts
 * WAT:    Leesqueries (Drizzle) voor server components — dashboard, CRM, profile sketch,
 *         client/candidate portal, formulieren.
 * WAAROM: Geen 'use server' hier: dit zijn geen Server Actions maar gewone server-only
 *         functies, alleen te importeren vanuit server components (nooit vanuit de client).
 *         `guarded()` zorgt dat elke functie `DB_MODE === 'demo'` checkt zodat `next build`
 *         niet crasht zolang er geen DATABASE_URL is (bv. de sandbox waarin builds
 *         geverifieerd worden zonder live DB).
 */

import 'server-only'
import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { db, DB_MODE } from '@/lib/db'
import {
  apiKeys,
  applicationDocuments,
  applicationStatusHistory,
  applications,
  auditLog,
  candidateTrainingProgress,
  candidates,
  chatKbEntries,
  clientCandidateShares,
  clientVacancyRequests,
  clients,
  companies,
  emergencyContacts,
  employmentContracts,
  interviewQuestions,
  interviews,
  jobCategories,
  mailOutbox,
  onboardingProgress,
  onboardingStepTemplates,
  payrollExportBatches,
  payrollExportItems,
  profiles,
  referenceChecks,
  suppliers,
  trainings,
  webhookEndpoints,
  type ApiKey,
  type ApplicationDocument,
  type ApplicationStatus,
  type ApplicationStatusHistoryRow,
  type AuditLogRow,
  type Candidate,
  type ChatKbEntry,
  type Client,
  type EmergencyContact,
  type EmploymentContract,
  type InterviewType,
  type JobBranche,
  type JobLevel,
  type MailStatus,
  type Profile,
  type ReferenceCheck,
  type Supplier,
  type VacancyRequestStatus,
  type WebhookEndpoint,
} from '../../drizzle/schema'
import { APPLICATION_STATUS_LABELS, type ApplicationWithCandidate } from '@/types/database'
import { needsAttention, probationAttention } from '@/lib/contract-monitor'
import { BRANCHE_SHORT_LABELS } from '@/constants/branche'

async function guarded<T>(empty: T, fn: () => Promise<T>): Promise<T> {
  if (DB_MODE === 'demo') return empty
  return fn()
}

// --- Applications (fase 1) ---

export async function listApplications(statusFilter?: ApplicationStatus, search?: string) {
  return guarded<ApplicationWithCandidate[]>([], async () => {
    const conditions = [
      statusFilter ? eq(applications.status, statusFilter) : undefined,
      search
        ? or(ilike(candidates.firstName, `%${search}%`), ilike(candidates.lastName, `%${search}%`), ilike(applications.positionApplied, `%${search}%`))
        : undefined,
    ].filter((c): c is Exclude<typeof c, undefined> => c !== undefined)

    const rows = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(applications.createdAt))

    return rows.map(({ application, candidate, company }) => ({ ...application, candidate, company }))
  })
}

export async function getApplicationById(id: string) {
  return guarded<ApplicationWithCandidate | null>(null, async () => {
    const [row] = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.id, id))

    if (!row) return null
    return { ...row.application, candidate: row.candidate, company: row.company }
  })
}

export async function listApplicationDocuments(applicationId: string) {
  return guarded<ApplicationDocument[]>([], () =>
    db
      .select()
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, applicationId))
      .orderBy(desc(applicationDocuments.createdAt))
  )
}

export async function getDocumentById(id: string) {
  return guarded<ApplicationDocument | null>(null, async () => {
    const [doc] = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, id))
    return doc ?? null
  })
}

/**
 * Haalt een document op, maar alleen als het hoort bij een application die gedeeld is met
 * `scope.clientId`, of eigendom is van `scope.candidateId`. Voor de client/candidate-portal —
 * NOOIT `getDocumentById` hergebruiken voor die routes, dat is de staff-only variant.
 */
export async function getDocumentByIdScoped(
  id: string,
  scope: { clientId?: string; candidateId?: string }
) {
  return guarded<ApplicationDocument | null>(null, async () => {
    const doc = await getDocumentById(id)
    if (!doc) return null

    if (scope.clientId) {
      const [share] = await db
        .select()
        .from(clientCandidateShares)
        .where(
          and(
            eq(clientCandidateShares.applicationId, doc.applicationId),
            eq(clientCandidateShares.clientId, scope.clientId)
          )
        )
      return share ? doc : null
    }

    if (scope.candidateId) {
      const [app] = await db
        .select()
        .from(applications)
        .where(and(eq(applications.id, doc.applicationId), eq(applications.candidateId, scope.candidateId)))
      return app ? doc : null
    }

    return null
  })
}

export async function listCompanies() {
  return guarded<typeof companies.$inferSelect[]>([], () =>
    db.select().from(companies).where(eq(companies.kind, 'subsidiary')).orderBy(companies.name)
  )
}

// --- CRM: clients, suppliers, job categories ---

export async function listClients(search?: string) {
  return guarded<Client[]>([], () =>
    db
      .select()
      .from(clients)
      .where(search ? or(ilike(clients.name, `%${search}%`), ilike(clients.contactName, `%${search}%`)) : undefined)
      .orderBy(clients.name)
  )
}

export async function listProfiles() {
  return guarded<Profile[]>([], () => db.select().from(profiles).orderBy(profiles.fullName))
}

export async function listAuditLog(filters?: { action?: string; entityType?: string }) {
  return guarded<AuditLogRow[]>([], () => {
    const conditions = [
      filters?.action ? eq(auditLog.action, filters.action) : undefined,
      filters?.entityType ? eq(auditLog.entityType, filters.entityType) : undefined,
    ].filter((c): c is Exclude<typeof c, undefined> => c !== undefined)

    return db
      .select()
      .from(auditLog)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(200)
  })
}

export async function listApiKeys() {
  return guarded<ApiKey[]>([], () => db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt)))
}

export async function listWebhookEndpoints() {
  return guarded<WebhookEndpoint[]>([], () => db.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.createdAt)))
}

export interface MailOutboxListRow {
  id: string
  template: string
  toEmail: string
  subject: string
  status: MailStatus
  attempts: number
  lastError: string | null
  sensitive: boolean
  hasBody: boolean
  createdAt: Date
  sentAt: Date | null
}

/** Recente mails voor het beheeroverzicht — bewust zonder de inhoud (die kan een eenmalige link bevatten). */
export async function listMailOutbox(limit = 50) {
  return guarded<MailOutboxListRow[]>([], async () => {
    const rows = await db
      .select({
        id: mailOutbox.id,
        template: mailOutbox.template,
        toEmail: mailOutbox.toEmail,
        subject: mailOutbox.subject,
        status: mailOutbox.status,
        attempts: mailOutbox.attempts,
        lastError: mailOutbox.lastError,
        sensitive: mailOutbox.sensitive,
        hasBody: sql<boolean>`${mailOutbox.bodyText} <> ''`,
        createdAt: mailOutbox.createdAt,
        sentAt: mailOutbox.sentAt,
      })
      .from(mailOutbox)
      .orderBy(desc(mailOutbox.createdAt))
      .limit(limit)
    return rows
  })
}

export async function getMailStatusCounts() {
  return guarded<Partial<Record<MailStatus, number>>>({}, async () => {
    const rows = await db.select({ status: mailOutbox.status, n: count() }).from(mailOutbox).groupBy(mailOutbox.status)
    return Object.fromEntries(rows.map((r) => [r.status, r.n]))
  })
}

export async function listChatKbEntries() {
  return guarded<ChatKbEntry[]>([], () => db.select().from(chatKbEntries).orderBy(desc(chatKbEntries.createdAt)))
}

export async function listActiveChatKbEntries() {
  return guarded<ChatKbEntry[]>([], () => db.select().from(chatKbEntries).where(eq(chatKbEntries.active, true)))
}

export async function getClientById(id: string) {
  return guarded<Client | null>(null, async () => {
    const [row] = await db.select().from(clients).where(eq(clients.id, id))
    return row ?? null
  })
}

export async function getClientByContactEmail(email: string) {
  return guarded<Client | null>(null, async () => {
    const [row] = await db.select().from(clients).where(eq(clients.contactEmail, email.toLowerCase().trim()))
    return row ?? null
  })
}

export async function listSuppliers(search?: string) {
  return guarded<Supplier[]>([], () =>
    db
      .select()
      .from(suppliers)
      .where(search ? ilike(suppliers.name, `%${search}%`) : undefined)
      .orderBy(suppliers.name)
  )
}

export async function getSupplierById(id: string) {
  return guarded<Supplier | null>(null, async () => {
    const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id))
    return row ?? null
  })
}

export async function listJobCategories() {
  return guarded<typeof jobCategories.$inferSelect[]>([], () =>
    db.select().from(jobCategories).where(eq(jobCategories.active, true)).orderBy(jobCategories.name)
  )
}

export async function listAllJobCategories() {
  return guarded<typeof jobCategories.$inferSelect[]>([], () =>
    db.select().from(jobCategories).orderBy(jobCategories.name)
  )
}

export async function listCandidates(
  filters: { branche?: JobBranche; level?: JobLevel; jobCategoryId?: string; search?: string } = {}
) {
  return guarded<Candidate[]>([], async () => {
    const searchCondition = filters.search
      ? or(ilike(candidates.firstName, `%${filters.search}%`), ilike(candidates.lastName, `%${filters.search}%`))
      : undefined

    if (!filters.branche && !filters.level && !filters.jobCategoryId) {
      return db
        .select()
        .from(candidates)
        .where(searchCondition)
        .orderBy(candidates.lastName, candidates.firstName)
    }

    const conditions = []
    if (filters.jobCategoryId) conditions.push(eq(applications.jobCategoryId, filters.jobCategoryId))
    if (filters.branche) conditions.push(eq(jobCategories.branche, filters.branche))
    if (filters.level) conditions.push(eq(jobCategories.level, filters.level))
    if (searchCondition) conditions.push(searchCondition)

    const rows = await db
      .select({ candidate: candidates })
      .from(candidates)
      .innerJoin(applications, eq(applications.candidateId, candidates.id))
      .innerJoin(jobCategories, eq(applications.jobCategoryId, jobCategories.id))
      .where(and(...conditions))

    const byId = new Map<string, Candidate>()
    for (const row of rows) byId.set(row.candidate.id, row.candidate)
    return Array.from(byId.values()).sort((a, b) => a.lastName.localeCompare(b.lastName))
  })
}

export async function getCandidateById(id: string) {
  return guarded<Candidate | null>(null, async () => {
    const [row] = await db.select().from(candidates).where(eq(candidates.id, id))
    return row ?? null
  })
}

// --- Client portal ---

export async function listSharedApplicationsForClient(clientId: string) {
  return guarded<(ApplicationWithCandidate & { share: typeof clientCandidateShares.$inferSelect })[]>(
    [],
    async () => {
      const rows = await db
        .select({ application: applications, candidate: candidates, company: companies, share: clientCandidateShares })
        .from(clientCandidateShares)
        .innerJoin(applications, eq(clientCandidateShares.applicationId, applications.id))
        .innerJoin(candidates, eq(applications.candidateId, candidates.id))
        .innerJoin(companies, eq(applications.companyId, companies.id))
        .where(eq(clientCandidateShares.clientId, clientId))
        .orderBy(desc(clientCandidateShares.sharedAt))

      return rows.map(({ application, candidate, company, share }) => ({ ...application, candidate, company, share }))
    }
  )
}

export async function getSharedApplicationForClient(applicationId: string, clientId: string) {
  return guarded<(ApplicationWithCandidate & { share: typeof clientCandidateShares.$inferSelect }) | null>(
    null,
    async () => {
      const [row] = await db
        .select({ application: applications, candidate: candidates, company: companies, share: clientCandidateShares })
        .from(clientCandidateShares)
        .innerJoin(applications, eq(clientCandidateShares.applicationId, applications.id))
        .innerJoin(candidates, eq(applications.candidateId, candidates.id))
        .innerJoin(companies, eq(applications.companyId, companies.id))
        .where(
          and(eq(clientCandidateShares.applicationId, applicationId), eq(clientCandidateShares.clientId, clientId))
        )

      if (!row) return null
      return { ...row.application, candidate: row.candidate, company: row.company, share: row.share }
    }
  )
}

export async function listShareableClientsForApplication(applicationId: string) {
  return guarded<Client[]>([], async () => {
    const shared = await db
      .select({ clientId: clientCandidateShares.clientId })
      .from(clientCandidateShares)
      .where(eq(clientCandidateShares.applicationId, applicationId))
    const sharedIds = new Set(shared.map((s) => s.clientId))

    const active = await db.select().from(clients).where(eq(clients.status, 'active')).orderBy(clients.name)
    return active.filter((c) => !sharedIds.has(c.id))
  })
}

export async function listApplicationShares(applicationId: string) {
  return guarded<(typeof clientCandidateShares.$inferSelect & { client: Client })[]>([], async () => {
    const rows = await db
      .select({ share: clientCandidateShares, client: clients })
      .from(clientCandidateShares)
      .innerJoin(clients, eq(clientCandidateShares.clientId, clients.id))
      .where(eq(clientCandidateShares.applicationId, applicationId))
      .orderBy(desc(clientCandidateShares.sharedAt))

    return rows.map(({ share, client }) => ({ ...share, client }))
  })
}

export async function listAllShares() {
  return guarded<(typeof clientCandidateShares.$inferSelect & { client: Client; application: ApplicationWithCandidate })[]>(
    [],
    async () => {
      const rows = await db
        .select({ share: clientCandidateShares, client: clients, application: applications, candidate: candidates, company: companies })
        .from(clientCandidateShares)
        .innerJoin(clients, eq(clientCandidateShares.clientId, clients.id))
        .innerJoin(applications, eq(clientCandidateShares.applicationId, applications.id))
        .innerJoin(candidates, eq(applications.candidateId, candidates.id))
        .innerJoin(companies, eq(applications.companyId, companies.id))
        .orderBy(desc(clientCandidateShares.sharedAt))

      return rows.map(({ share, client, application, candidate, company }) => ({
        ...share,
        client,
        application: { ...application, candidate, company },
      }))
    }
  )
}

export async function listVacancyRequests(search?: string) {
  return guarded<
    (typeof clientVacancyRequests.$inferSelect & { client: Client; jobCategory: typeof jobCategories.$inferSelect | null })[]
  >([], async () => {
    const rows = await db
      .select({ request: clientVacancyRequests, client: clients, jobCategory: jobCategories })
      .from(clientVacancyRequests)
      .innerJoin(clients, eq(clientVacancyRequests.clientId, clients.id))
      .leftJoin(jobCategories, eq(clientVacancyRequests.jobCategoryId, jobCategories.id))
      .where(search ? ilike(clients.name, `%${search}%`) : undefined)
      .orderBy(desc(clientVacancyRequests.createdAt))

    return rows.map(({ request, client, jobCategory }) => ({ ...request, client, jobCategory }))
  })
}

export async function listOwnVacancyRequestsForClient(clientId: string) {
  return guarded<(typeof clientVacancyRequests.$inferSelect & { jobCategory: typeof jobCategories.$inferSelect | null })[]>(
    [],
    async () => {
      const rows = await db
        .select({ request: clientVacancyRequests, jobCategory: jobCategories })
        .from(clientVacancyRequests)
        .leftJoin(jobCategories, eq(clientVacancyRequests.jobCategoryId, jobCategories.id))
        .where(eq(clientVacancyRequests.clientId, clientId))
        .orderBy(desc(clientVacancyRequests.createdAt))

      return rows.map(({ request, jobCategory }) => ({ ...request, jobCategory }))
    }
  )
}

// --- Candidate portal ---

export async function getOwnApplicationForCandidate(candidateId: string) {
  return guarded<ApplicationWithCandidate | null>(null, async () => {
    const [row] = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.createdAt))

    if (!row) return null
    return { ...row.application, candidate: row.candidate, company: row.company }
  })
}

// --- Interviews, contracts, onboarding, training, payroll ---

export async function listInterviews(applicationId: string) {
  return guarded<typeof interviews.$inferSelect[]>([], () =>
    db.select().from(interviews).where(eq(interviews.applicationId, applicationId)).orderBy(desc(interviews.createdAt))
  )
}

/** Actieve vragen voor het interview-formulier, gegroepeerd/gesorteerd per type. */
export async function listInterviewQuestions(type?: InterviewType) {
  return guarded<typeof interviewQuestions.$inferSelect[]>([], () =>
    db
      .select()
      .from(interviewQuestions)
      .where(type ? and(eq(interviewQuestions.type, type), eq(interviewQuestions.active, true)) : eq(interviewQuestions.active, true))
      .orderBy(interviewQuestions.type, interviewQuestions.stepOrder)
  )
}

/** Alle vragen (incl. inactieve) voor het beheerscherm. */
export async function listAllInterviewQuestions() {
  return guarded<typeof interviewQuestions.$inferSelect[]>([], () =>
    db.select().from(interviewQuestions).orderBy(interviewQuestions.type, interviewQuestions.stepOrder)
  )
}

export async function listContracts(applicationId: string) {
  return guarded<typeof employmentContracts.$inferSelect[]>([], () =>
    db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.applicationId, applicationId))
      .orderBy(desc(employmentContracts.createdAt))
  )
}

export async function listReferenceChecks(applicationId: string) {
  return guarded<ReferenceCheck[]>([], () =>
    db
      .select()
      .from(referenceChecks)
      .where(eq(referenceChecks.applicationId, applicationId))
      .orderBy(desc(referenceChecks.checkedAt))
  )
}

export async function listEmergencyContacts(candidateId: string) {
  return guarded<EmergencyContact[]>([], () =>
    db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.candidateId, candidateId))
      .orderBy(emergencyContacts.priority)
  )
}

/** Statusgeschiedenis van één sollicitatie, oudste eerst — voor de processtappen-tijdlijn. */
export async function listStatusHistory(applicationId: string) {
  return guarded<ApplicationStatusHistoryRow[]>([], () =>
    db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(applicationStatusHistory.createdAt)
  )
}

/** Alle sollicitaties van één kandidaat (nieuwste eerst) — voor de profielpagina. */
export async function listApplicationsForCandidate(candidateId: string) {
  return guarded<ApplicationWithCandidate[]>([], async () => {
    const rows = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.createdAt))
    return rows.map(({ application, candidate, company }) => ({ ...application, candidate, company }))
  })
}

/** Alle documenten over alle sollicitaties van één kandidaat heen. */
export async function listDocumentsForCandidate(candidateId: string) {
  return guarded<(ApplicationDocument & { positionApplied: string })[]>([], async () => {
    const rows = await db
      .select({ document: applicationDocuments, positionApplied: applications.positionApplied })
      .from(applicationDocuments)
      .innerJoin(applications, eq(applicationDocuments.applicationId, applications.id))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applicationDocuments.createdAt))
    return rows.map(({ document, positionApplied }) => ({ ...document, positionApplied }))
  })
}

export interface ContractMonitorRow {
  contract: EmploymentContract
  application: ApplicationWithCandidate
  clientName: string | null
}

/**
 * Alle lopende (concept/actieve) arbeidsovereenkomsten met sollicitatie + kandidaat — voor
 * "Contractperiode monitoren" en het RGM-badge-overzicht (PGC-HR-PR-0501-05). Sortering/filtering
 * op einddatum en badge-vervaldatum gebeurt in de pagina (datums zijn ISO-tekst).
 */
export async function listContractsForMonitoring() {
  return guarded<ContractMonitorRow[]>([], async () => {
    const rows = await db
      .select({
        contract: employmentContracts,
        application: applications,
        candidate: candidates,
        company: companies,
        clientName: clients.name,
      })
      .from(employmentContracts)
      .innerJoin(applications, eq(employmentContracts.applicationId, applications.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .leftJoin(clients, eq(applications.clientId, clients.id))
      .where(inArray(employmentContracts.status, ['draft', 'active']))
      .orderBy(desc(employmentContracts.createdAt))

    return rows.map(({ contract, application, candidate, company, clientName }) => ({
      contract,
      application: { ...application, candidate, company },
      clientName,
    }))
  })
}

export async function listOnboardingStepTemplates(companyId?: string) {
  return guarded<typeof onboardingStepTemplates.$inferSelect[]>([], () =>
    db
      .select()
      .from(onboardingStepTemplates)
      .where(
        companyId
          ? or(isNull(onboardingStepTemplates.companyId), eq(onboardingStepTemplates.companyId, companyId))
          : isNull(onboardingStepTemplates.companyId)
      )
      .orderBy(onboardingStepTemplates.stepOrder)
  )
}

export async function listOnboardingProgress(applicationId: string) {
  return guarded<(typeof onboardingProgress.$inferSelect & { step: typeof onboardingStepTemplates.$inferSelect })[]>(
    [],
    async () => {
      const rows = await db
        .select({ progress: onboardingProgress, step: onboardingStepTemplates })
        .from(onboardingProgress)
        .innerJoin(onboardingStepTemplates, eq(onboardingProgress.stepTemplateId, onboardingStepTemplates.id))
        .where(eq(onboardingProgress.applicationId, applicationId))
        .orderBy(onboardingStepTemplates.stepOrder)

      return rows.map(({ progress, step }) => ({ ...progress, step }))
    }
  )
}

export async function listOnboardingOverview() {
  return guarded<(ApplicationWithCandidate & { doneSteps: number; totalSteps: number })[]>([], async () => {
    const totalSteps = (await db.select().from(onboardingStepTemplates)).length

    const apps = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(inArray(applications.status, ['onboarding', 'active']))
      .orderBy(desc(applications.updatedAt))

    const progressCounts = await db
      .select({ applicationId: onboardingProgress.applicationId, value: count() })
      .from(onboardingProgress)
      .where(eq(onboardingProgress.status, 'done'))
      .groupBy(onboardingProgress.applicationId)
    const doneMap = new Map(progressCounts.map((p) => [p.applicationId, p.value]))

    return apps.map(({ application, candidate, company }) => ({
      ...application,
      candidate,
      company,
      doneSteps: doneMap.get(application.id) ?? 0,
      totalSteps,
    }))
  })
}

export async function listTrainings() {
  return guarded<typeof trainings.$inferSelect[]>([], () => db.select().from(trainings).orderBy(trainings.title))
}

export async function listCandidateTrainingProgress(applicationId: string) {
  return guarded<(typeof candidateTrainingProgress.$inferSelect & { training: typeof trainings.$inferSelect })[]>(
    [],
    async () => {
      const rows = await db
        .select({ progress: candidateTrainingProgress, training: trainings })
        .from(candidateTrainingProgress)
        .innerJoin(trainings, eq(candidateTrainingProgress.trainingId, trainings.id))
        .where(eq(candidateTrainingProgress.applicationId, applicationId))

      return rows.map(({ progress, training }) => ({ ...progress, training }))
    }
  )
}

export async function listAllTrainingProgress() {
  return guarded<
    (typeof candidateTrainingProgress.$inferSelect & {
      training: typeof trainings.$inferSelect
      application: ApplicationWithCandidate
    })[]
  >([], async () => {
    const rows = await db
      .select({
        progress: candidateTrainingProgress,
        training: trainings,
        application: applications,
        candidate: candidates,
        company: companies,
      })
      .from(candidateTrainingProgress)
      .innerJoin(trainings, eq(candidateTrainingProgress.trainingId, trainings.id))
      .innerJoin(applications, eq(candidateTrainingProgress.applicationId, applications.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .orderBy(desc(candidateTrainingProgress.id))

    return rows.map(({ progress, training, application, candidate, company }) => ({
      ...progress,
      training,
      application: { ...application, candidate, company },
    }))
  })
}

export async function listPayrollBatches() {
  return guarded<typeof payrollExportBatches.$inferSelect[]>([], () =>
    db.select().from(payrollExportBatches).orderBy(desc(payrollExportBatches.createdAt))
  )
}

export async function getPayrollBatchById(id: string) {
  return guarded<typeof payrollExportBatches.$inferSelect | null>(null, async () => {
    const [row] = await db.select().from(payrollExportBatches).where(eq(payrollExportBatches.id, id))
    return row ?? null
  })
}

export async function listPayrollBatchItems(batchId: string) {
  return guarded<(ApplicationWithCandidate & { externalEmployeeId: string | null })[]>([], async () => {
    const rows = await db
      .select({ item: payrollExportItems, application: applications, candidate: candidates, company: companies })
      .from(payrollExportItems)
      .innerJoin(applications, eq(payrollExportItems.applicationId, applications.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(payrollExportItems.batchId, batchId))

    return rows.map(({ item, application, candidate, company }) => ({
      ...application,
      candidate,
      company,
      externalEmployeeId: item.externalEmployeeId,
    }))
  })
}

export async function listActiveApplicationsForExport() {
  return guarded<ApplicationWithCandidate[]>([], async () => {
    const rows = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .orderBy(desc(applications.createdAt))

    return rows.map(({ application, candidate, company }) => ({ ...application, candidate, company }))
  })
}

// --- Dashboard KPIs ---

export interface DashboardStats {
  byStatus: Partial<Record<ApplicationStatus, number>>
  totalApplications: number
  totalClients: number
  totalCandidates: number
  pendingVacancyRequests: number
  /** Lopende contracten die binnen `EXPIRY_WARNING_DAYS` aflopen of al verlopen zijn. */
  contractsEndingSoon: number
  /** Lopende contracten met een RGM-badge die binnen `EXPIRY_WARNING_DAYS` verloopt of al verlopen is. */
  badgesExpiringSoon: number
  /** Proeftijdevaluaties (week 4/8) die open staan en verlopen zijn of binnen `PROBATION_LOOKAHEAD_DAYS` aan de beurt zijn. */
  probationEvaluationsDue: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return guarded<DashboardStats>(
    {
      byStatus: {},
      totalApplications: 0,
      totalClients: 0,
      totalCandidates: 0,
      pendingVacancyRequests: 0,
      contractsEndingSoon: 0,
      badgesExpiringSoon: 0,
      probationEvaluationsDue: 0,
    },
    async () => {
      const statusRows = await db.select({ status: applications.status, value: count() }).from(applications).groupBy(applications.status)
      const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.value])) as Partial<
        Record<ApplicationStatus, number>
      >
      const totalApplications = statusRows.reduce((sum, r) => sum + r.value, 0)

      const [{ value: totalClients }] = await db.select({ value: count() }).from(clients)
      const [{ value: totalCandidates }] = await db.select({ value: count() }).from(candidates)
      const [{ value: pendingVacancyRequests }] = await db
        .select({ value: count() })
        .from(clientVacancyRequests)
        .where(eq(clientVacancyRequests.status, 'submitted'))

      const running = await listContractsForMonitoring()
      const contractsEndingSoon = running.filter(
        ({ contract }) => contract.status === 'active' && needsAttention(contract.endDate)
      ).length
      const badgesExpiringSoon = running.filter(
        ({ contract }) => contract.status === 'active' && needsAttention(contract.badgeExpiryDate)
      ).length
      const probationEvaluationsDue = running.filter(
        ({ contract }) => contract.status === 'active' && probationAttention(contract).length > 0
      ).length

      return {
        byStatus,
        totalApplications,
        totalClients,
        totalCandidates,
        pendingVacancyRequests,
        contractsEndingSoon,
        badgesExpiringSoon,
        probationEvaluationsDue,
      }
    }
  )
}

// --- Reporting: conversion funnel + time-in-stage ---

export interface ReportingStats {
  funnel: { status: ApplicationStatus; label: string; reached: number }[]
  avgTimeInStageDays: { status: ApplicationStatus; label: string; avgDays: number; sampleSize: number }[]
}

const FUNNEL_ORDER: ApplicationStatus[] = ['new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding', 'active']

export async function getReportingStats(): Promise<ReportingStats> {
  return guarded<ReportingStats>({ funnel: [], avgTimeInStageDays: [] }, async () => {
    const reachedRows = await db
      .select({ status: applicationStatusHistory.toStatus, value: count() })
      .from(applicationStatusHistory)
      .groupBy(applicationStatusHistory.toStatus)
    const reachedByStatus = Object.fromEntries(reachedRows.map((r) => [r.status, r.value])) as Partial<
      Record<ApplicationStatus, number>
    >
    const funnel = FUNNEL_ORDER.map((status) => ({
      status,
      label: APPLICATION_STATUS_LABELS[status],
      reached: reachedByStatus[status] ?? 0,
    }))

    const historyRows = await db
      .select({
        applicationId: applicationStatusHistory.applicationId,
        toStatus: applicationStatusHistory.toStatus,
        createdAt: applicationStatusHistory.createdAt,
      })
      .from(applicationStatusHistory)
      .orderBy(applicationStatusHistory.applicationId, applicationStatusHistory.createdAt)

    const durationsByStatus = new Map<ApplicationStatus, number[]>()
    let prevAppId: string | null = null
    let prevStatus: ApplicationStatus | null = null
    let prevAt: Date | null = null

    for (const row of historyRows) {
      if (row.applicationId === prevAppId && prevStatus && prevAt) {
        const days = (row.createdAt.getTime() - prevAt.getTime()) / (1000 * 60 * 60 * 24)
        if (days >= 0) {
          const list = durationsByStatus.get(prevStatus) ?? []
          list.push(days)
          durationsByStatus.set(prevStatus, list)
        }
      }
      prevAppId = row.applicationId
      prevStatus = row.toStatus
      prevAt = row.createdAt
    }

    const avgTimeInStageDays = FUNNEL_ORDER.filter((s) => s !== 'active').map((status) => {
      const durations = durationsByStatus.get(status) ?? []
      const avgDays = durations.length ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0
      return { status, label: APPLICATION_STATUS_LABELS[status], avgDays, sampleSize: durations.length }
    })

    return { funnel, avgTimeInStageDays }
  })
}

// --- Reporting overview: KPI-kaarten, plaatsingen per maand, kandidaten per status ---

export interface Kpi {
  value: number
  /** Verandering t.o.v. de vorige maand: procent (candidates/placements/clients) of procentpunt (ratio). `null` = geen vergelijkbare vorige maand. */
  deltaPct: number | null
  deltaUnit: '%' | 'pt'
  /** Laatste 6 maanden t/m de gekozen maand, voor de sparkline. */
  series: number[]
}

export interface StatusSlice {
  key: 'new' | 'review' | 'interview' | 'placed' | 'closed'
  label: string
  count: number
}

export interface ReportsOverview {
  year: number
  years: number[]
  monthLabels: string[]
  kpis: { candidates: Kpi; placements: Kpi; placementRatio: Kpi; activeClients: Kpi }
  placementsPerMonth: number[]
  statusBreakdown: StatusSlice[]
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

// Gegroepeerd zoals het rapportage-ontwerp: vijf fasen i.p.v. negen statussen.
const STATUS_GROUPS: { key: StatusSlice['key']; label: string; statuses: ApplicationStatus[] }[] = [
  { key: 'new', label: 'Nieuw', statuses: ['new'] },
  { key: 'review', label: 'In beoordeling', statuses: ['in_review', 'shortlisted'] },
  { key: 'interview', label: 'Gesprek & aanbod', statuses: ['interview', 'offer'] },
  { key: 'placed', label: 'Geplaatst', statuses: ['onboarding', 'active'] },
  { key: 'closed', label: 'Afgewezen / ingetrokken', statuses: ['rejected', 'withdrawn'] },
]

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export async function getReportsOverview(requestedYear?: number): Promise<ReportsOverview> {
  const now = new Date()
  const emptyKpi: Kpi = { value: 0, deltaPct: null, deltaUnit: '%', series: [0, 0, 0, 0, 0, 0] }
  return guarded<ReportsOverview>(
    {
      year: now.getFullYear(),
      years: [now.getFullYear()],
      monthLabels: MONTH_LABELS,
      kpis: { candidates: emptyKpi, placements: emptyKpi, placementRatio: emptyKpi, activeClients: emptyKpi },
      placementsPerMonth: Array(12).fill(0),
      statusBreakdown: STATUS_GROUPS.map((g) => ({ key: g.key, label: g.label, count: 0 })),
    },
    async () => {
      const [candidateRows, clientRows, historyRows, statusRows] = await Promise.all([
        db.select({ createdAt: candidates.createdAt }).from(candidates),
        db.select({ createdAt: clients.createdAt, status: clients.status }).from(clients),
        db
          .select({
            applicationId: applicationStatusHistory.applicationId,
            toStatus: applicationStatusHistory.toStatus,
            createdAt: applicationStatusHistory.createdAt,
          })
          .from(applicationStatusHistory)
          .where(inArray(applicationStatusHistory.toStatus, ['offer', 'active'])),
        db.select({ status: applications.status, value: count() }).from(applications).groupBy(applications.status),
      ])

      // Beschikbare jaren: van het oudste record t/m dit jaar.
      const allDates = [...candidateRows.map((r) => r.createdAt), ...historyRows.map((r) => r.createdAt)]
      const firstYear = allDates.length ? Math.min(...allDates.map((d) => d.getFullYear())) : now.getFullYear()
      const years: number[] = []
      for (let y = now.getFullYear(); y >= firstYear; y--) years.push(y)

      const year = requestedYear && years.includes(requestedYear) ? requestedYear : now.getFullYear()
      const selMonth = year === now.getFullYear() ? now.getMonth() : 11

      // Exclusieve einddatum van de maand `selMonth - offset` (offset 0 = gekozen maand).
      const endOf = (offset: number) => new Date(year, selMonth - offset + 1, 1)
      const startOf = (offset: number) => new Date(year, selMonth - offset, 1)
      const offsets = [5, 4, 3, 2, 1, 0]

      const cumulative = (dates: Date[], offset: number) => dates.filter((d) => d < endOf(offset)).length
      const activeTransitions = historyRows.filter((r) => r.toStatus === 'active')
      const inMonth = (rows: { createdAt: Date }[], offset: number) =>
        rows.filter((r) => r.createdAt >= startOf(offset) && r.createdAt < endOf(offset)).length

      const candidateDates = candidateRows.map((r) => r.createdAt)
      const candidatesKpi: Kpi = {
        value: cumulative(candidateDates, 0),
        deltaPct: pctChange(cumulative(candidateDates, 0), cumulative(candidateDates, 1)),
        deltaUnit: '%',
        series: offsets.map((o) => cumulative(candidateDates, o)),
      }

      const placementsKpi: Kpi = {
        value: inMonth(activeTransitions, 0),
        deltaPct: pctChange(inMonth(activeTransitions, 0), inMonth(activeTransitions, 1)),
        deltaUnit: '%',
        series: offsets.map((o) => inMonth(activeTransitions, o)),
      }

      // Plaatsingsratio: van alle sollicitaties die een aanbod kregen, welk deel is uiteindelijk geplaatst.
      const ratioAt = (offset: number) => {
        const cutoff = endOf(offset)
        const reached = (status: 'offer' | 'active') =>
          new Set(historyRows.filter((r) => r.toStatus === status && r.createdAt < cutoff).map((r) => r.applicationId)).size
        const offered = reached('offer')
        return offered === 0 ? 0 : Math.round((reached('active') / offered) * 100)
      }
      const ratioKpi: Kpi = {
        value: ratioAt(0),
        deltaPct: ratioAt(1) === 0 && ratioAt(0) === 0 ? null : ratioAt(0) - ratioAt(1),
        deltaUnit: 'pt',
        series: offsets.map(ratioAt),
      }

      const activeClientDates = clientRows.filter((c) => c.status === 'active').map((c) => c.createdAt)
      const clientsKpi: Kpi = {
        value: clientRows.filter((c) => c.status === 'active').length,
        deltaPct: pctChange(cumulative(activeClientDates, 0), cumulative(activeClientDates, 1)),
        deltaUnit: '%',
        series: offsets.map((o) => cumulative(activeClientDates, o)),
      }

      const placementsPerMonth = MONTH_LABELS.map(
        (_, m) =>
          activeTransitions.filter((r) => r.createdAt.getFullYear() === year && r.createdAt.getMonth() === m).length
      )

      const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.value])) as Partial<Record<ApplicationStatus, number>>
      const statusBreakdown = STATUS_GROUPS.map((g) => ({
        key: g.key,
        label: g.label,
        count: g.statuses.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0),
      }))

      return {
        year,
        years,
        monthLabels: MONTH_LABELS,
        kpis: { candidates: candidatesKpi, placements: placementsKpi, placementRatio: ratioKpi, activeClients: clientsKpi },
        placementsPerMonth,
        statusBreakdown,
      }
    }
  )
}

// --- Landingspagina: publieke, geanonimiseerde teasers ---

export interface LandingVacancy {
  id: string
  title: string // functiecategorie
  place: string // klant-industrie of Pansa-bedrijf — nooit de klantnaam
  tag: string // branche-label
  isNew: boolean
  quantity: number
}

export interface LandingCandidate {
  id: string
  role: string
  place: string // district/woonplaats
  tag: string
  available: boolean
}

export interface LandingData {
  openVacancies: number
  availableCandidates: number
  vacancies: LandingVacancy[]
  candidates: LandingCandidate[]
}


const OPEN_VACANCY_STATUSES: VacancyRequestStatus[] = ['submitted', 'reviewing', 'approved']
const AVAILABLE_STATUSES: ApplicationStatus[] = ['new', 'in_review', 'shortlisted', 'interview', 'offer']

/**
 * Teasers voor de publieke landingspagina. Bewust zonder persoonsgegevens: geen namen, geen
 * klantnamen — alleen functie, branche, plaats en aantallen.
 */
export async function getLandingData(): Promise<LandingData> {
  return guarded<LandingData>({ openVacancies: 0, availableCandidates: 0, vacancies: [], candidates: [] }, async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const [vacancyRows, candidateRows, [{ value: availableCandidates }], openRows] = await Promise.all([
      db
        .select({ request: clientVacancyRequests, jobCategory: jobCategories, industry: clients.industry })
        .from(clientVacancyRequests)
        .innerJoin(clients, eq(clientVacancyRequests.clientId, clients.id))
        .leftJoin(jobCategories, eq(clientVacancyRequests.jobCategoryId, jobCategories.id))
        .where(inArray(clientVacancyRequests.status, OPEN_VACANCY_STATUSES))
        .orderBy(desc(clientVacancyRequests.createdAt))
        .limit(4),
      db
        .select({ application: applications, candidate: candidates, jobCategory: jobCategories })
        .from(applications)
        .innerJoin(candidates, eq(applications.candidateId, candidates.id))
        .leftJoin(jobCategories, eq(applications.jobCategoryId, jobCategories.id))
        .where(inArray(applications.status, AVAILABLE_STATUSES))
        .orderBy(desc(applications.createdAt))
        .limit(4),
      db.select({ value: count() }).from(applications).where(inArray(applications.status, AVAILABLE_STATUSES)),
      db
        .select({ quantity: clientVacancyRequests.quantity })
        .from(clientVacancyRequests)
        .where(inArray(clientVacancyRequests.status, OPEN_VACANCY_STATUSES)),
    ])

    return {
      openVacancies: openRows.reduce((sum, r) => sum + r.quantity, 0),
      availableCandidates,
      vacancies: vacancyRows.map(({ request, jobCategory, industry }) => ({
        id: request.id,
        title: jobCategory?.name ?? 'Diverse functies',
        place: industry || 'Pansa Group',
        tag: jobCategory ? BRANCHE_SHORT_LABELS[jobCategory.branche] : 'Overig',
        isNew: request.createdAt >= twoWeeksAgo,
        quantity: request.quantity,
      })),
      candidates: candidateRows.map(({ application, candidate, jobCategory }) => ({
        id: application.id,
        role: application.positionApplied,
        place: candidate.district || candidate.residence || 'Suriname',
        tag: jobCategory ? BRANCHE_SHORT_LABELS[jobCategory.branche] : 'Overig',
        available: true,
      })),
    }
  })
}

// --- Dashboard-overzicht (ontwerp "Pansa ATS Dashboard") ---

export interface DashboardOverview {
  year: number
  years: number[]
  monthLabels: string[]
  kpis: { applications: Kpi; placed: Kpi; clients: Kpi; candidates: Kpi }
  applicationsPerMonth: number[]
  statusBreakdown: { status: ApplicationStatus; label: string; count: number }[]
  topPositions: { position: string; count: number }[]
  alerts: { contractsEndingSoon: number; badgesExpiringSoon: number; probationEvaluationsDue: number }
}

const DASHBOARD_STATUSES: ApplicationStatus[] = ['new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding', 'active', 'rejected']

export async function getDashboardOverview(requestedYear?: number): Promise<DashboardOverview> {
  const now = new Date()
  const emptyKpi: Kpi = { value: 0, deltaPct: null, deltaUnit: '%', series: [0, 0, 0, 0, 0, 0] }
  return guarded<DashboardOverview>(
    {
      year: now.getFullYear(),
      years: [now.getFullYear()],
      monthLabels: MONTH_LABELS,
      kpis: { applications: emptyKpi, placed: emptyKpi, clients: emptyKpi, candidates: emptyKpi },
      applicationsPerMonth: Array(12).fill(0),
      statusBreakdown: DASHBOARD_STATUSES.map((status) => ({ status, label: APPLICATION_STATUS_LABELS[status], count: 0 })),
      topPositions: [],
      alerts: { contractsEndingSoon: 0, badgesExpiringSoon: 0, probationEvaluationsDue: 0 },
    },
    async () => {
      const [appRows, candidateRows, clientRows, activeHistory, running] = await Promise.all([
        db
          .select({ createdAt: applications.createdAt, status: applications.status, position: applications.positionApplied })
          .from(applications),
        db.select({ createdAt: candidates.createdAt }).from(candidates),
        db.select({ createdAt: clients.createdAt }).from(clients),
        db
          .select({ applicationId: applicationStatusHistory.applicationId, createdAt: applicationStatusHistory.createdAt })
          .from(applicationStatusHistory)
          .where(eq(applicationStatusHistory.toStatus, 'active'))
          .orderBy(applicationStatusHistory.createdAt),
        listContractsForMonitoring(),
      ])

      const firstYear = appRows.length ? Math.min(...appRows.map((r) => r.createdAt.getFullYear())) : now.getFullYear()
      const years: number[] = []
      for (let y = now.getFullYear(); y >= firstYear; y--) years.push(y)
      const year = requestedYear && years.includes(requestedYear) ? requestedYear : now.getFullYear()
      const selMonth = year === now.getFullYear() ? now.getMonth() : 11
      const endOf = (offset: number) => new Date(year, selMonth - offset + 1, 1)
      const offsets = [5, 4, 3, 2, 1, 0]
      const cumulative = (dates: Date[], offset: number) => dates.filter((d) => d < endOf(offset)).length
      const kpiFrom = (dates: Date[], valueNow?: number): Kpi => ({
        value: valueNow ?? cumulative(dates, 0),
        deltaPct: pctChange(cumulative(dates, 0), cumulative(dates, 1)),
        deltaUnit: '%',
        series: offsets.map((o) => cumulative(dates, o)),
      })

      // Eerste overgang naar "actief geplaatst" per sollicitatie.
      const firstActive = new Map<string, Date>()
      for (const row of activeHistory) if (!firstActive.has(row.applicationId)) firstActive.set(row.applicationId, row.createdAt)

      const appDates = appRows.map((r) => r.createdAt)
      const byStatus = new Map<ApplicationStatus, number>()
      const byPosition = new Map<string, number>()
      for (const row of appRows) {
        byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1)
        byPosition.set(row.position, (byPosition.get(row.position) ?? 0) + 1)
      }

      return {
        year,
        years,
        monthLabels: MONTH_LABELS,
        kpis: {
          applications: kpiFrom(appDates),
          placed: kpiFrom([...firstActive.values()], byStatus.get('active') ?? 0),
          clients: kpiFrom(clientRows.map((r) => r.createdAt)),
          candidates: kpiFrom(candidateRows.map((r) => r.createdAt)),
        },
        applicationsPerMonth: MONTH_LABELS.map(
          (_, m) => appDates.filter((d) => d.getFullYear() === year && d.getMonth() === m).length
        ),
        statusBreakdown: DASHBOARD_STATUSES.map((status) => ({
          status,
          label: APPLICATION_STATUS_LABELS[status],
          count: (byStatus.get(status) ?? 0) + (status === 'rejected' ? (byStatus.get('withdrawn') ?? 0) : 0),
        })),
        topPositions: [...byPosition.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 5)
          .map(([position, count]) => ({ position, count })),
        alerts: {
          contractsEndingSoon: running.filter(({ contract }) => contract.status === 'active' && needsAttention(contract.endDate)).length,
          badgesExpiringSoon: running.filter(({ contract }) => contract.status === 'active' && needsAttention(contract.badgeExpiryDate)).length,
          probationEvaluationsDue: running.filter(({ contract }) => contract.status === 'active' && probationAttention(contract).length > 0).length,
        },
      }
    }
  )
}

/** Aantal aandachtspunten voor het belletje in de topbar (contracten/badges/proeftijd). */
export async function countAttentionItems(): Promise<number> {
  return guarded<number>(0, async () => {
    const running = (await listContractsForMonitoring()).filter(({ contract }) => contract.status === 'active')
    return running.filter(
      ({ contract }) =>
        needsAttention(contract.endDate) || needsAttention(contract.badgeExpiryDate) || probationAttention(contract).length > 0
    ).length
  })
}
