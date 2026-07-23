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
import { logAuditEvent } from '@/lib/audit'
import { STAFF_ROLES } from '@/lib/roles'
import {
  clientCandidateShares,
  clientVacancyRequests,
  type JobScopeEntry,
  type VacancyRequestStatus,
} from '../../drizzle/schema'

// --- Staff: profielen delen ---

export async function shareApplicationWithClient(applicationId: string, clientId: string): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])

  await db
    .insert(clientCandidateShares)
    .values({ applicationId, clientId, sharedBy: session.userId })
    .onConflictDoNothing()

  await logAuditEvent(session, 'application_shared', { entityType: 'application', entityId: applicationId, metadata: { clientId } })
  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/client-shares')
}

export async function unshareApplication(shareId: string, applicationId: string): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])
  await db.delete(clientCandidateShares).where(eq(clientCandidateShares.id, shareId))
  await logAuditEvent(session, 'application_unshared', { entityType: 'application', entityId: applicationId })
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

function parseJobScope(raw: FormDataEntryValue | null): JobScopeEntry[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry): entry is JobScopeEntry => typeof entry?.category === 'string' && typeof entry?.requirement === 'string')
      .filter((entry) => entry.category.trim() && entry.requirement.trim())
  } catch {
    return []
  }
}

// --- Client: vacature-aanvraag ---

export async function createVacancyRequest(formData: FormData): Promise<void> {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const jobCategoryId = String(formData.get('jobCategoryId') ?? '').trim() || null
  const quantity = Number(formData.get('quantity') ?? 1) || 1
  const notes = String(formData.get('notes') ?? '').trim() || null
  const jobScope = parseJobScope(formData.get('jobScope'))

  await db.insert(clientVacancyRequests).values({
    clientId: session.clientId,
    jobCategoryId,
    quantity,
    notes,
    jobScope,
    requestedBy: session.userId,
  })

  revalidatePath('/client/requests')
  revalidatePath('/admin/client-requests')
  redirect('/client/requests?saved=1')
}

// --- Staff: vacature-aanvraag beoordelen ---

export async function updateVacancyRequestStatus(id: string, status: VacancyRequestStatus): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])
  await db.update(clientVacancyRequests).set({ status }).where(eq(clientVacancyRequests.id, id))
  await logAuditEvent(session, 'vacancy_request_status_changed', { entityType: 'client_vacancy_request', entityId: id, metadata: { status } })
  revalidatePath('/admin/client-requests')
}
