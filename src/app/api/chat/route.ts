/**
 * api/chat/route.ts
 * WAT:    Backend voor de chat-widget — publiek, geen sessie nodig (draait in de embed-iframe
 *         op externe websites). Beantwoordt vragen op basis van de actieve kennisbank-items
 *         (eenvoudige keyword-RAG: alle actieve items gaan als context mee, geen vector-DB).
 * WAAROM: Geen aparte flow-builder/intent-herkenning in deze v1 — puur een KB-gegronde
 *         Q&A-chat die automatisch in de taal van de bezoeker antwoordt.
 */

import { streamText } from 'ai'
import { listActiveChatKbEntries } from '@/services/queries'

const MAX_MESSAGES = 20

function buildSystemPrompt(kbContext: string): string {
  return `Je bent de chat-assistent van Pansa Group of Companies (CCC H. Pansa & Sons N.V.), een
manpower/outsourcing-bedrijf in Suriname dat via de Pansa ATS solliciteert en personeel plaatst.

Beantwoord vragen van bezoekers (kandidaten en potentiële clienten) kort, vriendelijk en accuraat,
uitsluitend op basis van de onderstaande kennisbank. Als het antwoord niet in de kennisbank staat,
zeg dat eerlijk en verwijs door naar het sollicitatieformulier (/apply) of het aanvraagformulier
voor personeel (/request-staffing) — verzin nooit informatie.

Herken automatisch de taal waarin de bezoeker schrijft — Nederlands, Engels, Sranantongo, Spaans,
Portugees, of vereenvoudigd Chinees — en antwoord altijd in diezelfde taal. Bij twijfel: Nederlands.

Kennisbank:
${kbContext || '(nog leeg — verwijs bezoekers naar HR voor vragen)'}`
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null

  if (!messages || messages.length === 0) {
    return new Response('Ongeldig verzoek.', { status: 400 })
  }

  const kbEntries = await listActiveChatKbEntries()
  const kbContext = kbEntries.map((e) => `### ${e.topic}\n${e.content}`).join('\n\n')

  const result = streamText({
    model: 'anthropic/claude-sonnet-5',
    system: buildSystemPrompt(kbContext),
    messages,
  })

  return result.toTextStreamResponse()
}
