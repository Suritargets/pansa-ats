/**
 * api/admin/ai/test-chat/route.ts
 * WAT:    Testchat voor "AI-training": stuurt een vraag naar de gekozen assistent (website of HR)
 *         met de huidige instructies, kennisbank en voorbeelden. Alleen super_admin.
 *         Elk gesprek wordt vastgelegd in ai_chat_log (id terug in header X-Log-Id) zodat het
 *         antwoord beoordeeld en het gebruik geteld kan worden.
 */

import { streamText } from 'ai'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isAssistant, isBudgetExhausted, loadAssistantConfig, recordAiUsage } from '@/lib/ai-assistant'
import { aiChatLog } from '../../../../../../drizzle/schema'

const MAX_MESSAGES = 20

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') return new Response('Geen toegang.', { status: 403 })

  const body = await request.json().catch(() => null)
  const assistant = body?.assistant
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null
  if (!isAssistant(assistant) || !messages || messages.length === 0) return new Response('Ongeldig verzoek.', { status: 400 })

  const last = messages[messages.length - 1]
  const question = typeof last?.content === 'string' ? last.content.slice(0, 4000) : ''
  if (!question) return new Response('Ongeldig verzoek.', { status: 400 })

  if (await isBudgetExhausted()) return new Response('Het maandbudget voor AI is op.', { status: 429 })
  const config = await loadAssistantConfig(assistant)

  const [log] = await db
    .insert(aiChatLog)
    .values({ assistant, model: config.model, question, source: 'test', createdBy: session.userId })
    .returning({ id: aiChatLog.id })
    .catch(() => [undefined])

  const result = streamText({
    model: config.model,
    system: config.system,
    temperature: config.temperature,
    messages,
    onFinish: async ({ text, usage, providerMetadata }) => {
      await recordAiUsage('test', config.model, usage, providerMetadata)
      if (log) await db.update(aiChatLog).set({ answer: text }).where(eq(aiChatLog.id, log.id)).catch(() => undefined)
    },
  })

  const response = result.toTextStreamResponse()
  if (log) response.headers.set('X-Log-Id', log.id)
  return response
}
