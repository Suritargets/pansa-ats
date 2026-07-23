'use server'

/**
 * webhooks.ts
 * WAT:    Server Actions voor beheer van uitgaande webhook-endpoints — alleen super_admin.
 */

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { webhookEndpoints, type WebhookEvent } from '../../drizzle/schema'

export async function createWebhookEndpoint(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])

  const name = String(formData.get('name') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const events = formData.getAll('events').map(String) as WebhookEvent[]

  if (!name || !url || events.length === 0) return

  const [created] = await db
    .insert(webhookEndpoints)
    .values({ name, url, events, secret: randomBytes(24).toString('hex'), createdBy: session.userId })
    .returning({ id: webhookEndpoints.id })

  await logAuditEvent(session, 'webhook_created', { entityType: 'webhook_endpoint', entityId: created.id, metadata: { name, url, events } })
  revalidatePath('/admin/settings/webhooks')
}

export async function toggleWebhookActive(id: string, active: boolean): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(webhookEndpoints).set({ active }).where(eq(webhookEndpoints.id, id))
  await logAuditEvent(session, active ? 'webhook_activated' : 'webhook_deactivated', { entityType: 'webhook_endpoint', entityId: id })
  revalidatePath('/admin/settings/webhooks')
}

export async function deleteWebhookEndpoint(id: string): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id))
  await logAuditEvent(session, 'webhook_deleted', { entityType: 'webhook_endpoint', entityId: id })
  revalidatePath('/admin/settings/webhooks')
}
