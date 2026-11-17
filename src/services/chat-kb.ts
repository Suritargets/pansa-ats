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
  const audienceRaw = String(formData.get('audience') ?? 'public')
  const audience = audienceRaw === 'hr' || audienceRaw === 'both' ? audienceRaw : 'public'
  if (!topic || !content) return

  const [created] = await db
    .insert(chatKbEntries)
    .values({ topic, content, audience, createdBy: session.userId })
    .returning({ id: chatKbEntries.id })
  await logAuditEvent(session, 'chat_kb_entry_created', { entityType: 'chat_kb_entry', entityId: created.id, metadata: { topic, audience } })
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

/** Startkennis voor de HR-assistent: het werkproces zoals het in de Pansa ATS is ingericht. */
const HR_STARTER_ENTRIES: { topic: string; content: string }[] = [
  {
    topic: 'HR-proces: van sollicitatie tot plaatsing',
    content:
      'Een sollicitatie doorloopt de statussen: Nieuw → In beoordeling → Shortlist → Interview → Aanbod → Onboarding → Actief geplaatst. ' +
      'Een sollicitatie kan ook eindigen als Afgewezen of Ingetrokken. Een statuswijziging doe je in het dossier van de sollicitatie; ' +
      'elke wijziging wordt vastgelegd in de statushistorie en het audit-log. Het systeem dwingt de volgorde niet af: controleer zelf ' +
      'dat interview, medische keuring en contract zijn afgerond vóór je iemand op Onboarding of Actief zet.',
  },
  {
    topic: 'Benodigde documenten van een kandidaat',
    content:
      'Bij het sollicitatieformulier (stap 7, Documenten) kan de kandidaat uploaden: ID-kaart, diploma\'s, certificaten, CV en bewijs van goed ' +
      'gedrag (politie-uittreksel). Documenten staan privé opgeslagen en zijn alleen zichtbaar voor medewerkers via het dossier. Ontbreekt er ' +
      'een document, vraag de kandidaat dan om het aan te leveren voordat de sollicitatie verder gaat.',
  },
  {
    topic: 'Rollen en toegang in het systeem',
    content:
      'Super admin: alles, inclusief gebruikers, instellingen, integraties en AI-training. HR-medewerker en recruiter: kandidaten, sollicitaties, ' +
      'onboarding, contracten en export. Client (externe opdrachtgever): eigen portaal met vacature-aanvragen en gedeelde kandidaatprofielen. ' +
      'Kandidaat: alleen het eigen dossier. Wie vragen heeft over toegang, verwijst naar een super admin.',
  },
  {
    topic: 'Digitaliseren van papieren sollicitatieformulieren',
    content:
      'Een papieren formulier kan via Digitaliseren (menu Werving & Selectie) worden gescand. De AI leest het formulier uit en vult de velden voor; ' +
      'de medewerker controleert de gegevens altijd zelf voordat het dossier wordt opgeslagen.',
  },
]

export async function importHrStarterKnowledge(): Promise<void> {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const existing = await db.select({ topic: chatKbEntries.topic }).from(chatKbEntries)
  const have = new Set(existing.map((e) => e.topic))
  const toAdd = HR_STARTER_ENTRIES.filter((e) => !have.has(e.topic))
  if (toAdd.length === 0) return
  await db.insert(chatKbEntries).values(toAdd.map((e) => ({ ...e, audience: 'hr', createdBy: session.userId })))
  await logAuditEvent(session, 'chat_kb_hr_starter_imported', { entityType: 'chat_kb_entry', metadata: { count: toAdd.length } })
  revalidatePath('/admin/settings/chat-kb')
}
