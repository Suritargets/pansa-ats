/**
 * public.ts
 * WAT:    Leesqueries voor de publieke pagina's achter de voorpagina (vacatures, trainingen, nieuws,
 *         talentenpool). Geen 'use server': alleen vanuit server components importeren.
 * WAAROM: Alles hier is bewust geanonimiseerd — geen kandidaatnamen, geen klantnamen. Een klant
 *         wordt hooguit als branche/industrie genoemd.
 */

import 'server-only'
import { and, count, desc, eq, gte, inArray } from 'drizzle-orm'
import { db, DB_MODE } from '@/lib/db'
import { BRANCHE_SHORT_LABELS } from '@/constants/branche'
import {
  applications,
  clientVacancyRequests,
  clients,
  companies,
  jobCategories,
  trainings,
  type ApplicationStatus,
  type JobBranche,
  type JobScopeEntry,
  type Training,
  type VacancyRequestStatus,
} from '../../drizzle/schema'

const OPEN_VACANCY_STATUSES: VacancyRequestStatus[] = ['submitted', 'reviewing', 'approved']
const AVAILABLE_STATUSES: ApplicationStatus[] = ['new', 'in_review', 'shortlisted', 'interview', 'offer']
const NEW_WITHIN_DAYS = 14

async function guarded<T>(empty: T, fn: () => Promise<T>): Promise<T> {
  if (DB_MODE === 'demo') return empty
  return fn()
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

export interface PublicVacancy {
  id: string
  title: string
  branche: string
  brancheKey: JobBranche | null
  place: string
  quantity: number
  requirements: JobScopeEntry[]
  createdAt: Date
  isNew: boolean
}

export async function listPublicVacancies(): Promise<PublicVacancy[]> {
  return guarded<PublicVacancy[]>([], async () => {
    const rows = await db
      .select({ request: clientVacancyRequests, jobCategory: jobCategories, industry: clients.industry })
      .from(clientVacancyRequests)
      .innerJoin(clients, eq(clientVacancyRequests.clientId, clients.id))
      .leftJoin(jobCategories, eq(clientVacancyRequests.jobCategoryId, jobCategories.id))
      .where(inArray(clientVacancyRequests.status, OPEN_VACANCY_STATUSES))
      .orderBy(desc(clientVacancyRequests.createdAt))
      .limit(50)

    const threshold = daysAgo(NEW_WITHIN_DAYS)
    return rows.map(({ request, jobCategory, industry }) => ({
      id: request.id,
      title: jobCategory?.name ?? 'Diverse functies',
      branche: jobCategory ? BRANCHE_SHORT_LABELS[jobCategory.branche] : 'Overig',
      brancheKey: jobCategory?.branche ?? null,
      place: industry || 'Pansa Group',
      quantity: request.quantity,
      requirements: request.jobScope,
      createdAt: request.createdAt,
      isNew: request.createdAt >= threshold,
    }))
  })
}

export async function getPublicVacancy(id: string): Promise<PublicVacancy | null> {
  // Alleen openstaande aanvragen zijn publiek; een id van een gesloten/afgewezen aanvraag geeft 404.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return guarded<PublicVacancy | null>(null, async () => {
    const [row] = await db
      .select({ request: clientVacancyRequests, jobCategory: jobCategories, industry: clients.industry })
      .from(clientVacancyRequests)
      .innerJoin(clients, eq(clientVacancyRequests.clientId, clients.id))
      .leftJoin(jobCategories, eq(clientVacancyRequests.jobCategoryId, jobCategories.id))
      .where(and(eq(clientVacancyRequests.id, id), inArray(clientVacancyRequests.status, OPEN_VACANCY_STATUSES)))
    if (!row) return null
    return {
      id: row.request.id,
      title: row.jobCategory?.name ?? 'Diverse functies',
      branche: row.jobCategory ? BRANCHE_SHORT_LABELS[row.jobCategory.branche] : 'Overig',
      brancheKey: row.jobCategory?.branche ?? null,
      place: row.industry || 'Pansa Group',
      quantity: row.request.quantity,
      requirements: row.request.jobScope,
      createdAt: row.request.createdAt,
      isNew: row.request.createdAt >= daysAgo(NEW_WITHIN_DAYS),
    }
  })
}

export async function listPublicTrainings(): Promise<Training[]> {
  return guarded<Training[]>([], () => db.select().from(trainings).orderBy(trainings.title))
}

export interface TalentPoolRow {
  category: string
  branche: string
  available: number
}

/** Beschikbare kandidaten per functie — alleen aantallen. */
export async function getTalentPool(): Promise<{ rows: TalentPoolRow[]; total: number }> {
  return guarded<{ rows: TalentPoolRow[]; total: number }>({ rows: [], total: 0 }, async () => {
    const rows = await db
      .select({ name: jobCategories.name, branche: jobCategories.branche, value: count() })
      .from(applications)
      .innerJoin(jobCategories, eq(applications.jobCategoryId, jobCategories.id))
      .where(inArray(applications.status, AVAILABLE_STATUSES))
      .groupBy(jobCategories.id, jobCategories.name, jobCategories.branche)
      .orderBy(desc(count()), jobCategories.name)

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(applications)
      .where(inArray(applications.status, AVAILABLE_STATUSES))

    return {
      rows: rows.map((r) => ({ category: r.name, branche: BRANCHE_SHORT_LABELS[r.branche], available: r.value })),
      total,
    }
  })
}

export interface NewsItem {
  id: string
  date: Date
  kind: 'vacature' | 'training'
  title: string
  text: string
  href: string
}

/** "Nieuws" = wat er recent bijkwam: nieuwe vacatures (30 dagen) en nieuwe trainingen (90 dagen). */
export async function listPublicNews(): Promise<NewsItem[]> {
  return guarded<NewsItem[]>([], async () => {
    const [vacancies, newTrainings] = await Promise.all([
      listPublicVacancies(),
      db.select().from(trainings).where(gte(trainings.createdAt, daysAgo(90))).orderBy(desc(trainings.createdAt)),
    ])
    const recent = daysAgo(30)
    const items: NewsItem[] = [
      ...vacancies
        .filter((v) => v.createdAt >= recent)
        .map((v) => ({
          id: `v-${v.id}`,
          date: v.createdAt,
          kind: 'vacature' as const,
          title: `${v.quantity > 1 ? `${v.quantity}× ` : ''}${v.title} gezocht`,
          text: `${v.branche} · ${v.place}`,
          href: '/vacatures',
        })),
      ...newTrainings.map((t) => ({
        id: `t-${t.id}`,
        date: t.createdAt,
        kind: 'training' as const,
        title: `Nieuwe training: ${t.title}`,
        text: t.description ?? (t.standard ? `Standaard: ${t.standard}` : ''),
        href: '/trainingen',
      })),
    ]
    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  })
}

export interface OwnApplication {
  id: string
  positionApplied: string
  companyName: string
  status: ApplicationStatus
  brancheKey: JobBranche | null
  createdAt: Date
}

/** Sollicitaties van één kandidaat (nieuwste eerst). De aanroeper geeft `session.candidateId` mee, nooit een URL-parameter. */
export async function listOwnApplications(candidateId: string): Promise<OwnApplication[]> {
  return guarded<OwnApplication[]>([], async () => {
    const rows = await db
      .select({ application: applications, company: companies.name, branche: jobCategories.branche })
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .leftJoin(jobCategories, eq(applications.jobCategoryId, jobCategories.id))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.createdAt))
    return rows.map(({ application, company, branche }) => ({
      id: application.id,
      positionApplied: application.positionApplied,
      companyName: company,
      status: application.status,
      brancheKey: branche ?? null,
      createdAt: application.createdAt,
    }))
  })
}

/** Open vacatures per branche — voor "Populaire categorieën" op de kandidaat-home. */
export function countByBranche(vacancies: PublicVacancy[]): { branche: string; brancheKey: JobBranche | null; count: number }[] {
  const map = new Map<string, { brancheKey: JobBranche | null; count: number }>()
  for (const v of vacancies) {
    const entry = map.get(v.branche) ?? { brancheKey: v.brancheKey, count: 0 }
    entry.count += v.quantity
    map.set(v.branche, entry)
  }
  return [...map.entries()].map(([branche, e]) => ({ branche, ...e })).sort((a, b) => b.count - a.count)
}
