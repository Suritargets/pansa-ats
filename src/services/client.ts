'use server'

/**
 * client.ts
 * WAT:    Server Actions voor het klantportaal (rol 'client').
 * WAAROM: Losse file van applications.ts omdat dit een andere actor is (klant, geen staff) —
 *         elke actie hier verifieert zelf opnieuw dat de sollicitatie met déze klant-company
 *         gedeeld is, ook al kwam de aanroep via een scherm dat die share al toont.
 */

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { clientCandidateShares } from '../../drizzle/schema'
import type { ServiceResult } from './applications'

export async function submitClientFeedback(applicationId: string, feedback: string): Promise<ServiceResult<null>> {
  try {
    const session = await requireSession(['client'])
    if (!session.companyId) {
      return { success: false, error: 'Geen klantbedrijf gekoppeld aan dit account.' }
    }

    const [share] = await db
      .select({ id: clientCandidateShares.id })
      .from(clientCandidateShares)
      .where(
        and(
          eq(clientCandidateShares.applicationId, applicationId),
          eq(clientCandidateShares.clientCompanyId, session.companyId)
        )
      )

    if (!share) {
      return { success: false, error: 'Niet geautoriseerd.' }
    }

    await db
      .update(clientCandidateShares)
      .set({ clientFeedback: feedback })
      .where(eq(clientCandidateShares.id, share.id))

    revalidatePath(`/client/applications/${applicationId}`)

    return { success: true, data: null }
  } catch (error) {
    console.error('[client.submitClientFeedback]', error)
    return { success: false, error: 'Feedback kon niet worden opgeslagen.' }
  }
}
