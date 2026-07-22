/**
 * queries.ts
 * WAT:    Leesqueries (Drizzle) voor server components — dashboard, profile sketch, formulieren.
 * WAAROM: Geen 'use server' hier: dit zijn geen Server Actions maar gewone server-only
 *         functies, alleen te importeren vanuit server components (nooit vanuit de client).
 *         DB_MODE-guard voorkomt dat build/prerender crasht zolang er nog geen Neon-project
 *         gekoppeld is (bv. eerste deploy vóórdat DATABASE_URL gezet is).
 */

import 'server-only'
import { and, desc, eq, ne } from 'drizzle-orm'
import { db, DB_MODE } from '@/lib/db'
import {
  applicationDocuments,
  applications,
  candidates,
  clientCandidateShares,
  companies,
  type ApplicationStatus,
} from '../../drizzle/schema'

export async function listApplications(statusFilter?: ApplicationStatus) {
  if (DB_MODE === 'demo') return []

  const rows = await db
    .select({ application: applications, candidate: candidates, company: companies })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(statusFilter ? eq(applications.status, statusFilter) : undefined)
    .orderBy(desc(applications.createdAt))

  return rows.map(({ application, candidate, company }) => ({ ...application, candidate, company }))
}

export async function getApplicationById(id: string) {
  if (DB_MODE === 'demo') return null

  const [row] = await db
    .select({ application: applications, candidate: candidates, company: companies })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, id))

  if (!row) return null
  return { ...row.application, candidate: row.candidate, company: row.company }
}

export async function listApplicationDocuments(applicationId: string) {
  if (DB_MODE === 'demo') return []

  return db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId))
    .orderBy(desc(applicationDocuments.createdAt))
}

export async function getDocumentById(id: string) {
  if (DB_MODE === 'demo') return null

  const [doc] = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, id))
  return doc ?? null
}

export async function listCompanies() {
  if (DB_MODE === 'demo') return []

  return db.select().from(companies).where(and(eq(companies.kind, 'subsidiary'))).orderBy(companies.name)
}

/**
 * Sollicitaties die met een klantbedrijf zijn gedeeld — voor het klantportaal-dashboard.
 * Scoping op `clientCompanyId` gebeurt hier in de query zelf, niet pas in de UI.
 */
export async function listSharedApplicationsForClient(clientCompanyId: string) {
  if (DB_MODE === 'demo') return []

  const rows = await db
    .select({ application: applications, candidate: candidates, company: companies, share: clientCandidateShares })
    .from(clientCandidateShares)
    .innerJoin(applications, eq(clientCandidateShares.applicationId, applications.id))
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(clientCandidateShares.clientCompanyId, clientCompanyId))
    .orderBy(desc(clientCandidateShares.sharedAt))

  return rows.map(({ application, candidate, company, share }) => ({
    ...application,
    candidate,
    company,
    share,
  }))
}

/**
 * Eén gedeelde sollicitatie voor het klantportaal. Geeft alleen resultaat terug als er
 * daadwerkelijk een share-record bestaat voor déze applicationId + clientCompanyId —
 * dat is de autorisatiecheck, niet alleen een lookup.
 */
export async function getSharedApplicationForClient(applicationId: string, clientCompanyId: string) {
  if (DB_MODE === 'demo') return null

  const [row] = await db
    .select({ application: applications, candidate: candidates, company: companies, share: clientCandidateShares })
    .from(clientCandidateShares)
    .innerJoin(applications, eq(clientCandidateShares.applicationId, applications.id))
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(eq(clientCandidateShares.applicationId, applicationId), eq(clientCandidateShares.clientCompanyId, clientCompanyId)))

  if (!row) return null
  return { ...row.application, candidate: row.candidate, company: row.company, share: row.share }
}

/** Klantbedrijven waarmee een sollicitatie nog NIET is gedeeld — voor de "Delen"-picker. */
export async function listShareableCompaniesForApplication(applicationId: string) {
  if (DB_MODE === 'demo') return []

  const alreadyShared = await db
    .select({ clientCompanyId: clientCandidateShares.clientCompanyId })
    .from(clientCandidateShares)
    .where(eq(clientCandidateShares.applicationId, applicationId))

  const sharedIds = new Set(alreadyShared.map((row) => row.clientCompanyId))
  const allCompanies = await db.select().from(companies).where(ne(companies.kind, 'parent')).orderBy(companies.name)

  return allCompanies.filter((company) => !sharedIds.has(company.id))
}

/** Klantbedrijven waarmee een sollicitatie al gedeeld is — voor de share-lijst in de profielschets. */
export async function listApplicationShares(applicationId: string) {
  if (DB_MODE === 'demo') return []

  return db
    .select({ share: clientCandidateShares, company: companies })
    .from(clientCandidateShares)
    .innerJoin(companies, eq(clientCandidateShares.clientCompanyId, companies.id))
    .where(eq(clientCandidateShares.applicationId, applicationId))
    .orderBy(desc(clientCandidateShares.sharedAt))
}
