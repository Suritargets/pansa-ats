'use server'

/**
 * reference-checks.ts
 * WAT:    Server Actions voor het antecedentenonderzoek (Vragenlijst PGC-HR-F-0507-04): HR belt de
 *         referent die de sollicitant opgaf en legt de antwoorden vast. Een sollicitatie kan
 *         meerdere referenties hebben.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { logAuditEvent } from '@/lib/audit'
import { referenceChecks } from '../../drizzle/schema'
import type { ServiceResult } from '@/lib/service-result'

export interface ReferenceCheckInput {
  refereeName?: string
  refereePosition?: string
  refereeCompany?: string
  refereeAddress?: string
  refereePhone?: string
  employmentDuration?: string
  reasonForLeaving?: string
  department?: string
  positionsHeld?: string
  oneWord?: string
  oneWordReason?: string
  workAttitude?: string
  wouldRehire?: boolean | null
  notes?: string
}

const clean = (value?: string) => value?.trim() || null

export async function addReferenceCheck(
  applicationId: string,
  input: ReferenceCheckInput
): Promise<ServiceResult<null>> {
  try {
    const session = await requireSession([...STAFF_ROLES])

    if (!input.refereeName?.trim() && !input.refereeCompany?.trim()) {
      return { success: false, error: 'Vul minimaal de naam of het bedrijf van de referent in.' }
    }

    const [row] = await db
      .insert(referenceChecks)
      .values({
        applicationId,
        refereeName: clean(input.refereeName),
        refereePosition: clean(input.refereePosition),
        refereeCompany: clean(input.refereeCompany),
        refereeAddress: clean(input.refereeAddress),
        refereePhone: clean(input.refereePhone),
        employmentDuration: clean(input.employmentDuration),
        reasonForLeaving: clean(input.reasonForLeaving),
        department: clean(input.department),
        positionsHeld: clean(input.positionsHeld),
        oneWord: clean(input.oneWord),
        oneWordReason: clean(input.oneWordReason),
        workAttitude: clean(input.workAttitude),
        wouldRehire: input.wouldRehire ?? null,
        notes: clean(input.notes),
        checkedBy: session.userId,
      })
      .returning({ id: referenceChecks.id })

    await logAuditEvent(session, 'reference_check_added', {
      entityType: 'application',
      entityId: applicationId,
      metadata: { referenceCheckId: row.id },
    })

    revalidatePath(`/admin/applications/${applicationId}`)
    return { success: true, data: null }
  } catch (error) {
    console.error('[reference-checks.addReferenceCheck]', error)
    return { success: false, error: 'Antecedentenonderzoek kon niet worden opgeslagen.' }
  }
}

export async function deleteReferenceCheck(id: string, applicationId: string): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])
  await db.delete(referenceChecks).where(eq(referenceChecks.id, id))
  await logAuditEvent(session, 'reference_check_deleted', { entityType: 'application', entityId: applicationId })
  revalidatePath(`/admin/applications/${applicationId}`)
}
