'use server'

/**
 * public-intake.ts
 * WAT:    Publieke, ongeauthenticeerde vacature-aanvraag — voor bedrijven die nog geen
 *         klantportaal-account hebben (bv. via de website of een embed).
 * WAAROM: Zoekt een bestaand client-record op contact-e-mail; anders wordt een nieuwe
 *         client aangemaakt met status 'prospect' zodat staff die later kan opwaarderen
 *         via het gewone Clienten-scherm. `requestedBy` blijft leeg (geen sessie).
 */

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'
import { dispatchWebhookEvent } from '@/lib/webhooks'
import { clients, clientVacancyRequests, type JobScopeEntry } from '../../drizzle/schema'

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

export async function submitPublicVacancyRequest(formData: FormData): Promise<void> {
  const companyName = String(formData.get('companyName') ?? '').trim()
  const contactName = String(formData.get('contactName') ?? '').trim()
  const contactEmail = String(formData.get('contactEmail') ?? '').trim().toLowerCase()
  const contactPhone = String(formData.get('contactPhone') ?? '').trim() || null
  const jobCategoryId = String(formData.get('jobCategoryId') ?? '').trim() || null
  const quantity = Number(formData.get('quantity') ?? 1) || 1
  const notes = String(formData.get('notes') ?? '').trim() || null
  const jobScope = parseJobScope(formData.get('jobScope'))
  const redirectTo = String(formData.get('redirectTo') ?? '/request-staffing')

  if (!companyName || !contactName || !contactEmail) {
    redirect(`${redirectTo}?error=1`)
  }

  let client = contactEmail ? (await db.select().from(clients).where(eq(clients.contactEmail, contactEmail)))[0] : undefined

  if (!client) {
    ;[client] = await db
      .insert(clients)
      .values({ name: companyName, contactName, contactEmail, contactPhone, status: 'prospect' })
      .returning()
  }

  const [request] = await db
    .insert(clientVacancyRequests)
    .values({ clientId: client.id, jobCategoryId, quantity, notes, jobScope })
    .returning({ id: clientVacancyRequests.id })

  await logAuditEvent(
    { userId: null, email: contactEmail },
    'public_vacancy_request_submitted',
    { entityType: 'client_vacancy_request', entityId: request.id, metadata: { companyName, contactEmail } }
  )

  dispatchWebhookEvent('vacancy_request.created', { requestId: request.id, clientId: client.id, companyName, quantity })

  redirect(`${redirectTo}?saved=1`)
}
