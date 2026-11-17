import 'server-only'

/**
 * ai-assistant.ts
 * WAT:    Gedeelde configuratie van de AI-assistenten: de website-chat ('public') en de
 *         HR-assistent voor medewerkers ('hr'). Bouwt de systeemprompt uit standaardprompt +
 *         eigen instructies + actieve kennisbank + actieve voorbeeldantwoorden.
 * WAAROM: Zowel de publieke chat-route als de HR-testchat gebruiken dit, zodat wat je in
 *         "AI-training" instelt precies is wat de assistent in de praktijk doet.
 *         Werkt ook als migratie 0015 nog niet op de database staat (valt dan terug op de
 *         oude kennisbank-query en standaardinstellingen).
 */

import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aiAssistantSettings, aiExamples, chatKbEntries } from '../../drizzle/schema'

export type Assistant = 'public' | 'hr'

export const ASSISTANT_LABELS: Record<Assistant, string> = {
  public: 'Website-chat (kandidaten & clienten)',
  hr: 'HR-assistent (medewerkers)',
}

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-5'

export const MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (standaard)' },
  { id: 'anthropic/claude-haiku-5', label: 'Claude Haiku 5 (sneller, goedkoper)' },
  { id: 'anthropic/claude-opus-5', label: 'Claude Opus 5 (zwaarste redenering)' },
]

export function isAssistant(value: unknown): value is Assistant {
  return value === 'public' || value === 'hr'
}

export function isAllowedModel(value: string): boolean {
  return MODEL_OPTIONS.some((m) => m.id === value)
}

const LANGUAGE_RULE = `Herken automatisch de taal waarin de gebruiker schrijft — Nederlands, Engels, Sranantongo, Spaans,
Portugees, of vereenvoudigd Chinees — en antwoord altijd in diezelfde taal. Bij twijfel: Nederlands.`

const BASE_PROMPTS: Record<Assistant, string> = {
  public: `Je bent de chat-assistent van Pansa Group of Companies (CCC H. Pansa & Sons N.V.), een
manpower/outsourcing-bedrijf in Suriname dat via de Pansa ATS solliciteert en personeel plaatst.

Beantwoord vragen van bezoekers (kandidaten en potentiële clienten) kort, vriendelijk en accuraat,
uitsluitend op basis van de onderstaande kennisbank. Als het antwoord niet in de kennisbank staat,
zeg dat eerlijk en verwijs door naar het sollicitatieformulier (/apply) of het aanvraagformulier
voor personeel (/request-staffing) — verzin nooit informatie.

${LANGUAGE_RULE}`,
  hr: `Je bent de interne HR-assistent van Pansa Group of Companies (CCC H. Pansa & Sons N.V.) in Suriname.
Je helpt HR-medewerkers en recruiters met werving en selectie, onboarding, contracten, documenten
en het werken in de Pansa ATS (sollicitatie-statussen, dossiers, interviews, medische keuring, badges).

Antwoord zakelijk, kort en praktisch, uitsluitend op basis van de onderstaande kennisbank en
voorbeeldantwoorden. Staat het antwoord daar niet in, zeg dat eerlijk en geef aan wie of wat er
geraadpleegd moet worden — verzin nooit beleid, wetsartikelen, bedragen of termijnen. Geef geen
juridisch bindend advies; verwijs bij arbeidsrechtelijke twijfel naar de juridisch adviseur.
Je kunt zelf geen handelingen in het systeem uitvoeren; leg uit welke stappen de medewerker moet nemen.

${LANGUAGE_RULE}`,
}

export interface AssistantConfig {
  assistant: Assistant
  model: string
  instructions: string
  system: string
  kbCount: number
  exampleCount: number
}

export async function loadAssistantConfig(assistant: Assistant): Promise<AssistantConfig> {
  const audiences = assistant === 'hr' ? ['hr', 'both'] : ['public', 'both']

  let instructions = ''
  let model = DEFAULT_MODEL
  let kb: { topic: string; content: string }[] = []
  let examples: { question: string; answer: string }[] = []

  try {
    const [[settings], kbRows, exampleRows] = await Promise.all([
      db.select().from(aiAssistantSettings).where(eq(aiAssistantSettings.assistant, assistant)),
      db
        .select({ topic: chatKbEntries.topic, content: chatKbEntries.content })
        .from(chatKbEntries)
        .where(and(eq(chatKbEntries.active, true), inArray(chatKbEntries.audience, audiences))),
      db
        .select({ question: aiExamples.question, answer: aiExamples.answer })
        .from(aiExamples)
        .where(and(eq(aiExamples.assistant, assistant), eq(aiExamples.active, true))),
    ])
    if (settings) {
      instructions = settings.instructions
      if (settings.model && isAllowedModel(settings.model)) model = settings.model
    }
    kb = kbRows
    examples = exampleRows
  } catch {
    // Migratie 0015 nog niet toegepast: terugvallen op de oude kennisbank (alleen publieke chat).
    if (assistant === 'public') {
      kb = await db
        .select({ topic: chatKbEntries.topic, content: chatKbEntries.content })
        .from(chatKbEntries)
        .where(eq(chatKbEntries.active, true))
        .catch(() => [])
    }
  }

  const parts = [BASE_PROMPTS[assistant]]
  if (instructions.trim()) parts.push(`Aanvullende instructies van de beheerder (volg deze op):\n${instructions.trim()}`)
  parts.push(
    `Kennisbank:\n${kb.map((e) => `### ${e.topic}\n${e.content}`).join('\n\n') || '(nog leeg — verwijs naar HR voor vragen)'}`,
  )
  if (examples.length > 0) {
    parts.push(
      `Voorbeeldantwoorden (toon en inhoud om te volgen bij vergelijkbare vragen):\n${examples
        .map((e) => `Vraag: ${e.question}\nAntwoord: ${e.answer}`)
        .join('\n\n')}`,
    )
  }

  return { assistant, model, instructions, system: parts.join('\n\n'), kbCount: kb.length, exampleCount: examples.length }
}
