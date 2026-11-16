'use server'

/**
 * search.ts
 * WAT:    Omni-search (Ctrl+K) — doorzoekt kandidaten, sollicitaties (dossiers), clienten en leveranciers.
 * ZOEKT OP: naam (voor- en achternaam, in beide volgordes), registratienummer (ook 'REG-00042' / '42'),
 *         ID (volledige UUID of het begin ervan), e-mail, telefoon, ID-kaartnummer, functie en bedrijfsnaam.
 */

import { eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { registrationLabel } from '@/lib/registration'
import { APPLICATION_STATUS_LABELS } from '@/types/database'
import { applications, candidates, clients, suppliers } from '../../drizzle/schema'

export type SearchGroup = 'Kandidaten' | 'Sollicitaties' | 'Clienten' | 'Leveranciers'

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  href: string
  group: SearchGroup
}

/** Escape LIKE-jokertekens zodat '%' of '_' in de zoekterm letterlijk gezocht worden. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

const LIMIT = 5

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireSession([...STAFF_ROLES])

  const term = query.trim().slice(0, 100)
  if (term.length < 2) return []
  const pattern = `%${escapeLike(term)}%`
  const prefix = `${escapeLike(term)}%`

  // 'REG-00042' of '00042' → volgnummer 42 (alleen bij een duidelijk registratienummer-patroon)
  const regMatch = /^reg-?0*(\d{1,9})$/i.exec(term)
  const seq = regMatch ? Number(regMatch[1]) : null

  const candidateFullName = sql`concat(${candidates.firstName}, ' ', ${candidates.lastName})`
  const candidateFullNameReversed = sql`concat(${candidates.lastName}, ' ', ${candidates.firstName})`

  const candidateConditions: SQL[] = [
    ilike(candidateFullName, pattern),
    ilike(candidateFullNameReversed, pattern),
    ilike(candidates.registrationNumber, pattern),
    ilike(candidates.email, pattern),
    ilike(candidates.phone, pattern),
    ilike(candidates.idNumber, pattern),
    ilike(sql`${candidates.id}::text`, prefix),
  ]
  if (seq !== null) candidateConditions.push(eq(candidates.registrationSeq, seq))

  const applicationConditions: SQL[] = [
    ilike(candidateFullName, pattern),
    ilike(candidateFullNameReversed, pattern),
    ilike(applications.positionApplied, pattern),
    ilike(candidates.registrationNumber, pattern),
    ilike(sql`${applications.id}::text`, prefix),
  ]
  if (seq !== null) applicationConditions.push(eq(candidates.registrationSeq, seq))

  const [candidateRows, applicationRows, clientRows, supplierRows] = await Promise.all([
    db
      .select({
        id: candidates.id,
        firstName: candidates.firstName,
        lastName: candidates.lastName,
        phone: candidates.phone,
        email: candidates.email,
        registrationNumber: candidates.registrationNumber,
        registrationSeq: candidates.registrationSeq,
      })
      .from(candidates)
      .where(or(...candidateConditions))
      .limit(LIMIT),
    db
      .select({
        id: applications.id,
        positionApplied: applications.positionApplied,
        status: applications.status,
        firstName: candidates.firstName,
        lastName: candidates.lastName,
        registrationNumber: candidates.registrationNumber,
        registrationSeq: candidates.registrationSeq,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(or(...applicationConditions))
      .limit(LIMIT),
    db
      .select({ id: clients.id, name: clients.name, contactName: clients.contactName })
      .from(clients)
      .where(or(ilike(clients.name, pattern), ilike(clients.contactName, pattern), ilike(sql`${clients.id}::text`, prefix)))
      .limit(LIMIT),
    db
      .select({ id: suppliers.id, name: suppliers.name, contactName: suppliers.contactName })
      .from(suppliers)
      .where(or(ilike(suppliers.name, pattern), ilike(suppliers.contactName, pattern), ilike(sql`${suppliers.id}::text`, prefix)))
      .limit(LIMIT),
  ])

  return [
    ...candidateRows.map((c) => ({
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: [registrationLabel(c), c.phone ?? c.email].filter(Boolean).join(' · '),
      href: `/admin/candidates/${c.id}`,
      group: 'Kandidaten' as const,
    })),
    ...applicationRows.map((a) => ({
      id: a.id,
      title: `${a.firstName} ${a.lastName}`,
      subtitle: [registrationLabel(a), a.positionApplied, APPLICATION_STATUS_LABELS[a.status] ?? a.status].filter(Boolean).join(' · '),
      href: `/admin/applications/${a.id}`,
      group: 'Sollicitaties' as const,
    })),
    ...clientRows.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.contactName ?? 'Client',
      href: `/admin/clients/${c.id}`,
      group: 'Clienten' as const,
    })),
    ...supplierRows.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.contactName ?? 'Leverancier/Relatie',
      href: `/admin/suppliers/${s.id}`,
      group: 'Leveranciers' as const,
    })),
  ]
}
