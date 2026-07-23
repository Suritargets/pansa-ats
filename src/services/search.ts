'use server'

/**
 * search.ts
 * WAT:    Omni-search (Ctrl+K) — doorzoekt kandidaten, clienten en sollicitaties op naam.
 */

import { eq, ilike, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { applications, candidates, clients } from '../../drizzle/schema'

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  href: string
  group: 'Kandidaten' | 'Clienten' | 'Sollicitaties'
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireSession([...STAFF_ROLES])

  const term = query.trim()
  if (term.length < 2) return []
  const pattern = `%${term}%`

  const [candidateRows, clientRows, applicationRows] = await Promise.all([
    db
      .select({ id: candidates.id, firstName: candidates.firstName, lastName: candidates.lastName, phone: candidates.phone })
      .from(candidates)
      .where(or(ilike(candidates.firstName, pattern), ilike(candidates.lastName, pattern)))
      .limit(5),
    db.select({ id: clients.id, name: clients.name, contactName: clients.contactName }).from(clients).where(ilike(clients.name, pattern)).limit(5),
    db
      .select({
        id: applications.id,
        positionApplied: applications.positionApplied,
        candidateFirstName: candidates.firstName,
        candidateLastName: candidates.lastName,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(or(ilike(candidates.firstName, pattern), ilike(candidates.lastName, pattern), ilike(applications.positionApplied, pattern)))
      .limit(5),
  ])

  return [
    ...candidateRows.map((c) => ({
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.phone ?? 'Kandidaat',
      href: `/admin/candidates?search=${encodeURIComponent(`${c.firstName} ${c.lastName}`)}`,
      group: 'Kandidaten' as const,
    })),
    ...clientRows.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.contactName ?? 'Client',
      href: `/admin/clients/${c.id}`,
      group: 'Clienten' as const,
    })),
    ...applicationRows.map((a) => ({
      id: a.id,
      title: `${a.candidateFirstName} ${a.candidateLastName}`,
      subtitle: a.positionApplied,
      href: `/admin/applications/${a.id}`,
      group: 'Sollicitaties' as const,
    })),
  ]
}
