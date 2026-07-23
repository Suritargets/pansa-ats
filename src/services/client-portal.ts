'use server'

/**
 * client-portal.ts
 * WAT:    Server Actions voor de klantzone: profielen delen (staff), feedback en
 *         vacature-aanvragen (client).
 * WAAROM: Elke client-actie leidt de `clientId` af uit de sessie (`session.clientId`),
 *         nooit uit een form-veld of route-param — dat voorkomt dat een klant kan
 *         feedback geven op of een aanvraag doen namens een ander klantbedrijf.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { clientCandidateShares, clientVacancyRequests, type VacancyRequestStatus } from '../../drizzle/schema'

// --- Staff: profielen delen ---

export async function shareApplicationWithClient(applicationId: string, clientId: string): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])

  await db
    .insert(clientCandidateShares)
    .values({ applicationId, clientId, sharedBy: session.userId })
    .onConflictDoNothing()

  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/client-shares')
}

export async function unshareApplication(shareId: string, applicationId: string): Promise<void> {
  await requireSession([...STAFF_ROLES])
  await db.delete(clientCandidateShares).where(eq(clientCandidateShares.id, shareId))
  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/client-shares')
}

// --- Client: feedback op een gedeeld profiel ---

export async function submitClientFeedback(applicationId: string, feedback: string): Promise<void> {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  await db
    .update(clientCandidateShares)
    .set({ clientFeedback: feedback })
    .where(
      and(eq(clientCandidateShares.applicationId, applicationId), eq(clientCandidateShares.clientId, session.clientId))
    )

  revalidatePath(`/client/applications/${applicationId}`)
}

// --- Client: vacature-aanvraag ---

export async function createVacancyRequest(formData: FormData): Promise<void> {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const jobCategoryId = String(formData.get('jobCategoryId') ?? '').trim() || null
  const quantity = Number(formData.get('quantity') ?? 1) || 1
  const notes = String(formData.get('notes') ?? '').trim() || null

  await db.insert(clientVacancyRequests).values({
    clientId: session.clientId,
    jobCategoryId,
    quantity,
    notes,
    requestedBy: session.userId,
  })

  revalidatePath('/client/requests')
  revalidatePath('/admin/client-requests')
  redirect('/client/requests?saved=1')
}

// --- Staff: vacature-aanvraag beoordelen ---

export async function updateVacancyRequestStatus(id: string, status: VacancyRequestStatus): Promise<void> {
  await requireSession([...STAFF_ROLES])
  await db.update(clientVacancyRequests).set({ status }).where(eq(clientVacancyRequests.id, id))
  revalidatePath('/admin/client-requests')
}
