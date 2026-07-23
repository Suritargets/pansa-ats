'use server'

/**
 * api-keys.ts
 * WAT:    Server Actions voor beheer van publieke API-sleutels — alleen super_admin.
 * WAAROM: Typed-object actions (i.p.v. FormData) omdat de ruwe sleutel eenmalig moet
 *         worden teruggegeven aan de client om te tonen — daarna is alleen de hash bekend.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { generateApiKey } from '@/lib/api-keys'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import type { ServiceResult } from '@/lib/service-result'
import { apiKeys, type ApiKeyScope } from '../../drizzle/schema'

export async function createApiKey(
  name: string,
  scopes: ApiKeyScope[]
): Promise<ServiceResult<{ id: string; key: string; prefix: string }>> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  if (!name.trim() || scopes.length === 0) {
    return { success: false, error: 'Naam en minstens één scope zijn verplicht.' }
  }

  const { key, prefix, hash } = generateApiKey()
  const [created] = await db
    .insert(apiKeys)
    .values({ name: name.trim(), keyPrefix: prefix, keyHash: hash, scopes, createdBy: session.userId })
    .returning({ id: apiKeys.id })

  await logAuditEvent(session, 'api_key_created', { entityType: 'api_key', entityId: created.id, metadata: { name, scopes } })
  revalidatePath('/admin/settings/api-keys')

  return { success: true, data: { id: created.id, key, prefix } }
}

export async function revokeApiKey(id: string): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(apiKeys).set({ active: false }).where(eq(apiKeys.id, id))
  await logAuditEvent(session, 'api_key_revoked', { entityType: 'api_key', entityId: id })
  revalidatePath('/admin/settings/api-keys')
}
