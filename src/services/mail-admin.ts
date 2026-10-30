'use server'

/**
 * mail-admin.ts
 * WAT:    Server Actions voor het mail-overzicht (/admin/settings/mail): opnieuw proberen en testmail.
 * WAAROM: Alleen super_admin. De testmail wordt direct verstuurd en geeft de uitkomst terug, zodat de
 *         SMTP-instellingen meteen te controleren zijn zonder naar de logs te hoeven.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { enqueueMail, isMailConfigured, processOutbox, retryMail } from '@/lib/mail'
import { isPlausibleEmail } from '@/lib/mail-core'
import { mailOutbox } from '../../drizzle/schema'

export type TestMailState = { error: string | null; success?: string | null }

export async function retryMailAction(id: string): Promise<{ error: string | null }> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (!isMailConfigured()) return { error: 'SMTP is niet ingesteld. Zet SMTP_HOST en SMTP_FROM in Vercel.' }
  const queued = await retryMail(id)
  if (!queued) return { error: 'Deze mail kan niet opnieuw worden verstuurd (geen inhoud meer of al in behandeling).' }
  await logAuditEvent(session, 'mail_retried', { entityType: 'mail_outbox', entityId: id })
  revalidatePath('/admin/settings/mail')
  return { error: null }
}

export async function sendTestMail(_prev: TestMailState, formData: FormData): Promise<TestMailState> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (!isMailConfigured()) return { error: 'SMTP is niet ingesteld. Zet SMTP_HOST en SMTP_FROM in Vercel.' }

  const to = String(formData.get('to') ?? '').trim().toLowerCase()
  if (!isPlausibleEmail(to)) return { error: 'Vul een geldig e-mailadres in.' }

  const id = await enqueueMail(to, { template: 'test' }, { createdBy: session.userId })
  if (!id) return { error: 'De testmail kon niet in de wachtrij worden gezet.' }

  // Direct verwerken (naast het after()-verzoek): de claim is atomair, dus er gaat nooit twee keer iets uit.
  await processOutbox({ ids: [id] })
  const [row] = await db.select({ status: mailOutbox.status, lastError: mailOutbox.lastError }).from(mailOutbox).where(eq(mailOutbox.id, id))
  await logAuditEvent(session, 'mail_test_sent', { entityType: 'mail_outbox', entityId: id, metadata: { to } })
  revalidatePath('/admin/settings/mail')

  if (row?.status === 'sent') return { error: null, success: `Testmail verstuurd naar ${to}.` }
  return { error: `Verzenden is niet gelukt${row?.lastError ? `: ${row.lastError}` : '.'} De mail blijft in de wachtrij.` }
}

/** Verwerkt de wachtrij nu, in plaats van te wachten op de dagelijkse cron. */
export async function processQueueAction(): Promise<{ error: string | null; message?: string }> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (!isMailConfigured()) return { error: 'SMTP is niet ingesteld. Zet SMTP_HOST en SMTP_FROM in Vercel.' }
  const result = await processOutbox({ limit: 50 })
  await logAuditEvent(session, 'mail_queue_processed', { entityType: 'mail_outbox', metadata: { ...result } })
  revalidatePath('/admin/settings/mail')
  return { error: null, message: `${result.sent} verstuurd, ${result.retry} opnieuw ingepland, ${result.failed} mislukt.` }
}
