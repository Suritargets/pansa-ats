'use server'

/**
 * chat-kb.ts
 * WAT:    Server Actions voor de chat-widget kennisbank — alleen super_admin.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { chatKbEntries } from '../../drizzle/schema'

export async function createChatKbEntry(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])

  const topic = String(formData.get('topic') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  if (!topic || !content) return

  const [created] = await db.insert(chatKbEntries).values({ topic, content, createdBy: session.userId }).returning({ id: chatKbEntries.id })
  await logAuditEvent(session, 'chat_kb_entry_created', { entityType: 'chat_kb_entry', entityId: created.id, metadata: { topic } })
  revalidatePath('/admin/settings/chat-kb')
}

export async function toggleChatKbEntryActive(id: string, active: boolean): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(chatKbEntries).set({ active }).where(eq(chatKbEntries.id, id))
  revalidatePath('/admin/settings/chat-kb')
}

export async function deleteChatKbEntry(id: string): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  await db.delete(chatKbEntries).where(eq(chatKbEntries.id, id))
  await logAuditEvent(session, 'chat_kb_entry_deleted', { entityType: 'chat_kb_entry', entityId: id })
  revalidatePath('/admin/settings/chat-kb')
}
