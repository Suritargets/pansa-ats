'use server'

/**
 * ai-training.ts
 * WAT:    Server Actions voor AI-training: instructies + model per assistent, voorbeeldantwoorden
 *         en feedback op testgesprekken — alleen super_admin.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { isAllowedModel, isAssistant } from '@/lib/ai-assistant'
import { aiAssistantSettings, aiChatLog, aiExamples } from '../../drizzle/schema'

const PATH = '/admin/settings/chat-kb'
const MAX_INSTRUCTIONS = 6000

export async function saveAssistantSettings(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const assistant = String(formData.get('assistant') ?? '')
  if (!isAssistant(assistant)) return

  const instructions = String(formData.get('instructions') ?? '').trim().slice(0, MAX_INSTRUCTIONS)
  const modelRaw = String(formData.get('model') ?? '')
  const model = isAllowedModel(modelRaw) ? modelRaw : null

  await db
    .insert(aiAssistantSettings)
    .values({ assistant, instructions, model })
    .onConflictDoUpdate({ target: aiAssistantSettings.assistant, set: { instructions, model, updatedAt: new Date() } })
  await logAuditEvent(session, 'ai_settings_saved', { entityType: 'ai_assistant', metadata: { assistant, model } })
  revalidatePath(PATH)
}

export async function createAiExample(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const assistant = String(formData.get('assistant') ?? '')
  const question = String(formData.get('question') ?? '').trim()
  const answer = String(formData.get('answer') ?? '').trim()
  if (!isAssistant(assistant) || !question || !answer) return

  const [created] = await db.insert(aiExamples).values({ assistant, question, answer, createdBy: session.userId }).returning({ id: aiExamples.id })
  await logAuditEvent(session, 'ai_example_created', { entityType: 'ai_example', entityId: created.id, metadata: { assistant } })
  revalidatePath(PATH)
}

export async function toggleAiExample(id: string, active: boolean): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(aiExamples).set({ active }).where(eq(aiExamples.id, id))
  revalidatePath(PATH)
}

export async function deleteAiExample(id: string): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  await db.delete(aiExamples).where(eq(aiExamples.id, id))
  await logAuditEvent(session, 'ai_example_deleted', { entityType: 'ai_example', entityId: id })
  revalidatePath(PATH)
}

/** Beoordeel een antwoord (1 = goed, -1 = fout) en leg eventueel het gewenste antwoord vast. */
export async function rateAiAnswer(logId: string, rating: 1 | -1, note?: string): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  const cleanNote = note?.trim().slice(0, 4000) || null
  await db.update(aiChatLog).set({ rating, note: cleanNote }).where(eq(aiChatLog.id, logId))
  revalidatePath(PATH)
}

/** Maak van een beoordeeld gesprek (met het gewenste antwoord) een voorbeeldantwoord. */
export async function promoteLogToExample(logId: string): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const [row] = await db.select().from(aiChatLog).where(eq(aiChatLog.id, logId))
  if (!row || !isAssistant(row.assistant)) return
  const answer = (row.note?.trim() || row.answer?.trim()) ?? ''
  if (!answer) return
  const [created] = await db
    .insert(aiExamples)
    .values({ assistant: row.assistant, question: row.question, answer, createdBy: session.userId })
    .returning({ id: aiExamples.id })
  await logAuditEvent(session, 'ai_example_created', { entityType: 'ai_example', entityId: created.id, metadata: { assistant: row.assistant, fromLog: logId } })
  revalidatePath(PATH)
}
