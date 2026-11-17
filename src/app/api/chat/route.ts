/**
 * api/chat/route.ts
 * WAT:    Backend voor de chat-widget — publiek, geen sessie nodig (draait in de embed-iframe
 *         op externe websites). Beantwoordt vragen op basis van de actieve kennisbank-items
 *         (eenvoudige keyword-RAG: alle actieve items gaan als context mee, geen vector-DB).
 * WAAROM: Geen aparte flow-builder/intent-herkenning in deze v1 — puur een KB-gegronde
 *         Q&A-chat die automatisch in de taal van de bezoeker antwoordt.
 */

import { streamText } from 'ai'
import { loadAssistantConfig } from '@/lib/ai-assistant'

const MAX_MESSAGES = 20

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null

  if (!messages || messages.length === 0) {
    return new Response('Ongeldig verzoek.', { status: 400 })
  }

  // Prompt, model, kennisbank en voorbeelden komen uit "AI-training" (admin/settings/chat-kb).
  const config = await loadAssistantConfig('public')

  const result = streamText({
    model: config.model,
    system: config.system,
    messages,
  })

  return result.toTextStreamResponse()
}
