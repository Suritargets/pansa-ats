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
import { and, count, desc, eq, inArray, isNull, or } from 'drizzle-orm'
import { db, DB_MODE } from '@/lib/db'
import {
  applicationDocuments,
  applications,
  candidateTrainingProgress,
  candidates,
  clientCandidateShares,
  clientVacancyRequests,
  clients,
  companies,
  employmentContracts,
  interviews,
  jobCategories,
  onboardingProgress,
  onboardingStepTemplates,
  payrollExportBatches,
  payrollExportItems,
  suppliers,
  trainings,
  type ApplicationDocument,
  type ApplicationStatus,
  type Candidate,
  type Client,
  type JobBranche,
  type JobLevel,
  type Supplier,
} from '../../drizzle/schema'
import type { ApplicationWithCandidate } from '@/types/database'

async function guarded<T>(empty: T, fn: () => Promise<T>): Promise<T> {
  if (DB_MODE === 'demo') return empty
  return fn()
}

// --- Applications (fase 1) ---

export async function listApplications(statusFilter?: ApplicationStatus) {
  return guarded<ApplicationWithCandidate[]>([], async () => {
    const rows = await db
      .select({ application: applications, candidate: candidates, company: companies })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(statusFilter ? eq(applications.status, statusFilter) : undefined)
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

export async function listClients() {
  return guarded<Client[]>([], () => db.select().from(clients).orderBy(clients.name))
}

export async function getClientById(id: string) {
  return guarded<Client | null>(null, async () => {
    const [row] = await db.select().from(clients).where(eq(clients.id, id))
    return row ?? null
  })
}

export async function listSuppliers() {
  return guarded<Supplier[]>([], () => db.select().from(suppliers).orderBy(suppliers.name))
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
  filters: { branche?: JobBranche; level?: JobLevel; jobCategoryId?: string } = {}
) {
  return guarded<Candidate[]>([], async () => {
    if (!filters.branche && !filters.level && !filters.jobCategoryId) {
      return db.select().from(candidates).orderBy(candidates.lastName, candidates.firstName)
    }

    const conditions = []
    if (filters.jobCategoryId) conditions.push(eq(applications.jobCategoryId, filters.jobCategoryId))
    if (filters.branche) conditions.push(eq(jobCategories.branche, filters.branche))
    if (filters.level) conditions.push(eq(jobCategories.level, filters.level))

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

export async function listVacancyRequests() {
  return guarded<
    (typeof clientVacancyRequests.$inferSelect & { client: Client; jobCategory: typeof jobCategories.$inferSelect | null })[]
  >([], async () => {
    const rows = await db
      .select({ request: clientVacancyRequests, client: clients, jobCategory: jobCategories })
      .from(clientVacancyRequests)
      .innerJoin(clients, eq(clientVacancyRequests.clientId, clients.id))
      .leftJoin(jobCategories, eq(clientVacancyRequests.jobCategoryId, jobCategories.id))
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

export async function listContracts(applicationId: string) {
  return guarded<typeof employmentContracts.$inferSelect[]>([], () =>
    db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.applicationId, applicationId))
      .orderBy(desc(employmentContracts.createdAt))
  )
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
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return guarded<DashboardStats>(
    { byStatus: {}, totalApplications: 0, totalClients: 0, totalCandidates: 0, pendingVacancyRequests: 0 },
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

      return { byStatus, totalApplications, totalClients, totalCandidates, pendingVacancyRequests }
    }
  )
}
