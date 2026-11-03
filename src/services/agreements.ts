'use server'

/**
 * agreements.ts
 * WAT:    Server Actions voor dienstverlenings-overeenkomsten met klanten (aanmaken, wijzigen, opzeggen, verwijderen).
 * WAAROM: Eén plek voor looptijd, opzegtermijn en automatisch verlengen; de rekenregels staan in lib/service-agreements.ts.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { STAFF_ROLES } from '@/lib/roles'
import { parseDate } from '@/lib/import-fields'
import { agreementKindEnum, agreementStatusEnum, serviceAgreements, type AgreementKind, type AgreementStatus } from '../../drizzle/schema'

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()
const intIn = (fd: FormData, key: string, fallback: number, min: number, max: number) => {
  const n = Number.parseInt(str(fd, key), 10)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

/** Leest en controleert het formulier. Bij een fout komt de melding terug in de URL (`?error=`), zodat het formulier hem toont. */
function readFields(fd: FormData): { ok: true; values: Omit<typeof serviceAgreements.$inferInsert, 'clientId' | 'createdBy'> } | { ok: false; error: string } {
  const title = str(fd, 'title')
  if (!title) return { ok: false, error: 'Titel is verplicht.' }
  const kind = str(fd, 'kind') as AgreementKind
  const status = str(fd, 'status') as AgreementStatus
  if (!agreementKindEnum.enumValues.includes(kind)) return { ok: false, error: 'Kies een soort overeenkomst.' }
  if (!agreementStatusEnum.enumValues.includes(status)) return { ok: false, error: 'Kies een status.' }

  const startRaw = str(fd, 'startDate')
  const endRaw = str(fd, 'endDate')
  const startDate = startRaw ? parseDate(startRaw) : null
  const endDate = endRaw ? parseDate(endRaw) : null
  if (startRaw && !startDate) return { ok: false, error: 'Startdatum is ongeldig.' }
  if (endRaw && !endDate) return { ok: false, error: 'Einddatum is ongeldig.' }
  if (startDate && endDate && endDate < startDate) return { ok: false, error: 'De einddatum ligt vóór de startdatum.' }

  const valueRaw = str(fd, 'value').replace(',', '.')
  if (valueRaw && !/^\d+(\.\d{1,2})?$/.test(valueRaw)) return { ok: false, error: 'Waarde is ongeldig (bijvoorbeeld 2500 of 2500,50).' }

  return {
    ok: true,
    values: {
      title,
      kind,
      status,
      startDate,
      endDate,
      termMonths: intIn(fd, 'termMonths', 12, 1, 120),
      autoRenew: fd.get('autoRenew') === 'on',
      noticeDays: intIn(fd, 'noticeDays', 30, 0, 365),
      value: valueRaw || null,
      currency: (str(fd, 'currency') || 'USD').toUpperCase().slice(0, 3),
      notes: str(fd, 'notes') || null,
    },
  }
}

function back(path: string, error: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(error)}`)
}

export async function createAgreement(clientId: string, fd: FormData): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])
  const parsed = readFields(fd)
  if (!parsed.ok) back(`/admin/agreements/new?clientId=${clientId}`, parsed.error)
  const [row] = await db.insert(serviceAgreements).values({ ...parsed.values, clientId, createdBy: session.userId }).returning({ id: serviceAgreements.id })
  await logAuditEvent(session, 'agreement_created', { entityType: 'service_agreement', entityId: row.id })
  revalidatePath('/admin/agreements')
  redirect(`/admin/agreements/${row.id}?saved=1`)
}

export async function updateAgreement(id: string, fd: FormData): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])
  const parsed = readFields(fd)
  if (!parsed.ok) back(`/admin/agreements/${id}`, parsed.error)
  await db.update(serviceAgreements).set({ ...parsed.values, updatedAt: new Date() }).where(eq(serviceAgreements.id, id))
  await logAuditEvent(session, 'agreement_updated', { entityType: 'service_agreement', entityId: id })
  revalidatePath('/admin/agreements')
  redirect(`/admin/agreements/${id}?saved=1`)
}

export async function deleteAgreement(id: string): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])
  await db.delete(serviceAgreements).where(eq(serviceAgreements.id, id))
  await logAuditEvent(session, 'agreement_deleted', { entityType: 'service_agreement', entityId: id })
  revalidatePath('/admin/agreements')
  redirect('/admin/agreements')
}
