/**
 * queries.test.ts
 * WAT:    Regressietest voor het `guarded()`-contract in queries.ts: elke read-functie moet,
 *         zonder DATABASE_URL (DB_MODE === 'demo'), een leeg/null resultaat teruggeven i.p.v.
 *         te crashen — dit is wat `next build` in deze sandbox (geen DB-credentials) draaiend
 *         houdt. Draait zelf ook zonder DATABASE_URL, dus test precies dat pad.
 *
 *         Dekt geen live-DB-gedrag (join-logica, client/candidate-scoping) — dat vereist een
 *         echte Postgres-verbinding die in deze sandbox niet beschikbaar is.
 */
import { describe, expect, it } from 'vitest'
import { DB_MODE } from '@/lib/db'
import * as queries from '../queries'

describe('DB_MODE', () => {
  it('is "demo" without a DATABASE_URL (this test suite must run without one)', () => {
    expect(DB_MODE).toBe('demo')
  })
})

describe('queries.ts demo-mode fallbacks', () => {
  it('list* functions resolve to an empty array without touching the database', async () => {
    await expect(queries.listApplications()).resolves.toEqual([])
    await expect(queries.listApplicationDocuments('app-1')).resolves.toEqual([])
    await expect(queries.listCompanies()).resolves.toEqual([])
    await expect(queries.listClients()).resolves.toEqual([])
    await expect(queries.listProfiles()).resolves.toEqual([])
    await expect(queries.listAuditLog()).resolves.toEqual([])
    await expect(queries.listApiKeys()).resolves.toEqual([])
    await expect(queries.listWebhookEndpoints()).resolves.toEqual([])
    await expect(queries.listChatKbEntries()).resolves.toEqual([])
    await expect(queries.listActiveChatKbEntries()).resolves.toEqual([])
    await expect(queries.listSuppliers()).resolves.toEqual([])
    await expect(queries.listJobCategories()).resolves.toEqual([])
    await expect(queries.listAllJobCategories()).resolves.toEqual([])
    await expect(queries.listCandidates()).resolves.toEqual([])
    await expect(queries.listSharedApplicationsForClient('client-1')).resolves.toEqual([])
    await expect(queries.listShareableClientsForApplication('app-1')).resolves.toEqual([])
    await expect(queries.listApplicationShares('app-1')).resolves.toEqual([])
    await expect(queries.listAllShares()).resolves.toEqual([])
    await expect(queries.listVacancyRequests()).resolves.toEqual([])
    await expect(queries.listOwnVacancyRequestsForClient('client-1')).resolves.toEqual([])
    await expect(queries.listInterviews('app-1')).resolves.toEqual([])
    await expect(queries.listInterviewQuestions()).resolves.toEqual([])
    await expect(queries.listAllInterviewQuestions()).resolves.toEqual([])
    await expect(queries.listContracts('app-1')).resolves.toEqual([])
    await expect(queries.listOnboardingStepTemplates()).resolves.toEqual([])
    await expect(queries.listOnboardingProgress('app-1')).resolves.toEqual([])
    await expect(queries.listOnboardingOverview()).resolves.toEqual([])
    await expect(queries.listTrainings()).resolves.toEqual([])
    await expect(queries.listCandidateTrainingProgress('app-1')).resolves.toEqual([])
    await expect(queries.listAllTrainingProgress()).resolves.toEqual([])
    await expect(queries.listPayrollBatches()).resolves.toEqual([])
    await expect(queries.listPayrollBatchItems('batch-1')).resolves.toEqual([])
    await expect(queries.listActiveApplicationsForExport()).resolves.toEqual([])
  })

  it('getById-style functions resolve to null without touching the database', async () => {
    await expect(queries.getApplicationById('app-1')).resolves.toBeNull()
    await expect(queries.getDocumentById('doc-1')).resolves.toBeNull()
    await expect(queries.getDocumentByIdScoped('doc-1', { clientId: 'client-1' })).resolves.toBeNull()
    await expect(queries.getClientById('client-1')).resolves.toBeNull()
    await expect(queries.getClientByContactEmail('client@example.com')).resolves.toBeNull()
    await expect(queries.getSupplierById('supplier-1')).resolves.toBeNull()
    await expect(queries.getCandidateById('candidate-1')).resolves.toBeNull()
    await expect(queries.getSharedApplicationForClient('app-1', 'client-1')).resolves.toBeNull()
    await expect(queries.getOwnApplicationForCandidate('candidate-1')).resolves.toBeNull()
    await expect(queries.getPayrollBatchById('batch-1')).resolves.toBeNull()
  })

  it('getDashboardStats resolves to the zeroed-out shape', async () => {
    await expect(queries.getDashboardStats()).resolves.toEqual({
      byStatus: {},
      totalApplications: 0,
      totalClients: 0,
      totalCandidates: 0,
      pendingVacancyRequests: 0,
    })
  })

  it('getReportingStats resolves to the empty shape', async () => {
    await expect(queries.getReportingStats()).resolves.toEqual({ funnel: [], avgTimeInStageDays: [] })
  })
})
