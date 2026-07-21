/**
 * queries.ts
 * WAT:    Leesqueries (Drizzle) voor server components — dashboard, profile sketch, formulieren.
 * WAAROM: Geen 'use server' hier: dit zijn geen Server Actions maar gewone server-only
 *         functies, alleen te importeren vanuit server components (nooit vanuit de client).
 *         DB_MODE-guard voorkomt dat build/prerender crasht zolang er nog geen Neon-project
 *         gekoppeld is (bv. eerste deploy vóórdat DATABASE_URL gezet is).
 */

import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db, DB_MODE } from '@/lib/db'
import {
  applicationDocuments,
  applications,
  candidates,
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
