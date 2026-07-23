'use server'

/**
 * import.ts
 * WAT:    Bulk-import van kandidaten via CSV — staff plakt/uploadt, ziet een preview
 *         (client-side geparsed), en bevestigt pas dan de daadwerkelijke insert.
 * WAAROM: Elke rij wordt als candidate + application aangemaakt via dezelfde velden als
 *         het gewone sollicitatieformulier, zodat er geen tweede databron ontstaat.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { STAFF_ROLES } from '@/lib/roles'
import type { ServiceResult } from '@/lib/service-result'
import { applications, candidates } from '../../drizzle/schema'

export interface ImportCandidateRow {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  positionApplied: string
}

export async function bulkImportCandidates(
  companyId: string,
  jobCategoryId: string | null,
  rows: ImportCandidateRow[]
): Promise<ServiceResult<{ count: number }>> {
  try {
    const session = await requireSession([...STAFF_ROLES])

    const validRows = rows.filter((row) => row.firstName.trim() && row.lastName.trim() && row.positionApplied.trim())
    if (!companyId || validRows.length === 0) {
      return { success: false, error: 'Kies een bedrijf en zorg dat er geldige rijen zijn (voornaam, achternaam, functie verplicht).' }
    }

    let count = 0
    for (const row of validRows) {
      const [candidate] = await db
        .insert(candidates)
        .values({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
        })
        .returning({ id: candidates.id })

      await db.insert(applications).values({
        candidateId: candidate.id,
        companyId,
        jobCategoryId: jobCategoryId || null,
        positionApplied: row.positionApplied.trim(),
        source: 'digitized_paper',
      })

      count++
    }

    await logAuditEvent(session, 'candidates_bulk_imported', { entityType: 'application', metadata: { count, companyId } })

    revalidatePath('/admin/candidates')
    revalidatePath('/admin/applications')

    return { success: true, data: { count } }
  } catch (error) {
    console.error('[import.bulkImportCandidates]', error)
    return { success: false, error: 'Import mislukt. Probeer het opnieuw.' }
  }
}
