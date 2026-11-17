'use server'

/**
 * ai-training.ts
 * WAT:    Server Actions voor AI-training: instructies + model per assistent, voorbeeldantwoorden
 *         en feedback op testgesprekken — alleen super_admin.
 */

import { revalidatePath } from 'next/cache'
import { generateText } from 'ai'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { DEFAULT_MODEL, isAllowedModel, isAssistant, recordAiUsage } from '@/lib/ai-assistant'
import { aiAssistantSettings, aiChatLog, aiExamples, aiGlobalSettings } from '../../drizzle/schema'

const PATH = '/admin/settings/chat-kb'
const MAX_INSTRUCTIONS = 6000

export async function saveAssistantInstructions(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const assistant = String(formData.get('assistant') ?? '')
  if (!isAssistant(assistant)) return

  const instructions = String(formData.get('instructions') ?? '').trim().slice(0, MAX_INSTRUCTIONS)
  await db
    .insert(aiAssistantSettings)
    .values({ assistant, instructions })
    .onConflictDoUpdate({ target: aiAssistantSettings.assistant, set: { instructions, updatedAt: new Date() } })
  await logAuditEvent(session, 'ai_instructions_saved', { entityType: 'ai_assistant', metadata: { assistant } })
  revalidatePath(PATH)
}

/** Modellen per assistent, OCR-model, temperatuur en maandbudget in één keer. */
export async function saveAiLimits(formData: FormData): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])

  for (const assistant of ['public', 'hr'] as const) {
    const raw = String(formData.get(`model-${assistant}`) ?? '')
    const model = isAllowedModel(raw) ? raw : null
    await db
      .insert(aiAssistantSettings)
      .values({ assistant, model })
      .onConflictDoUpdate({ target: aiAssistantSettings.assistant, set: { model, updatedAt: new Date() } })
  }

  const ocrRaw = String(formData.get('ocrModel') ?? '')
  const ocrModel = isAllowedModel(ocrRaw) ? ocrRaw : null
  const temperature = parseDecimal(formData.get('temperature'), 0, 2)
  const monthlyBudgetUsd = parseDecimal(formData.get('monthlyBudgetUsd'), 0, 100000)

  await db
    .insert(aiGlobalSettings)
    .values({ id: 'global', ocrModel, temperature, monthlyBudgetUsd })
    .onConflictDoUpdate({ target: aiGlobalSettings.id, set: { ocrModel, temperature, monthlyBudgetUsd, updatedAt: new Date() } })
  await logAuditEvent(session, 'ai_limits_saved', { entityType: 'ai_assistant', metadata: { ocrModel, temperature, monthlyBudgetUsd } })
  revalidatePath(PATH)
}

/** Lege invoer of een ongeldig getal = null (standaard / geen limiet). */
function parseDecimal(value: FormDataEntryValue | null, min: number, max: number): string | null {
  const text = String(value ?? '').trim().replace(',', '.')
  if (!text) return null
  const n = Number(text)
  if (!Number.isFinite(n) || n < min || n > max) return null
  return String(n)
}

export type ConnectionTestResult = { ok: true; model: string; ms: number } | { ok: false; error: string }

/** Doet één minimale aanroep naar het AI Gateway om te zien of de verbinding werkt. */
export async function testAiConnection(): Promise<ConnectionTestResult> {
  await requireSession([...SUPER_ADMIN_ROLES])
  const started = Date.now()
  try {
    const result = await generateText({ model: DEFAULT_MODEL, prompt: 'Antwoord met één woord: ok', maxOutputTokens: 8 })
    await recordAiUsage('test', DEFAULT_MODEL, result.usage, result.providerMetadata)
    return { ok: true, model: DEFAULT_MODEL, ms: Date.now() - started }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Onbekende fout'
    return { ok: false, error: message.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 300) }
  }
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
