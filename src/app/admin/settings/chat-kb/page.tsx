/**
 * admin/settings/chat-kb/page.tsx
 * WAT:    AI-training voor de assistenten (website-chat en HR-assistent): kennis, instructies,
 *         voorbeeldantwoorden, feedback, testchat en model & gebruik. Alleen super_admin.
 * WAAROM: Eenvoudige RAG zonder vector-DB: alle actieve kennisitems voor de gekozen assistent
 *         gaan als context mee (zie lib/ai-assistant.ts). Tabs via ?tab= zodat elke tab gewoon
 *         een server-gerenderde pagina is.
 */

import Link from 'next/link'
import { count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listChatKbEntries } from '@/services/queries'
import { importHrStarterKnowledge } from '@/services/chat-kb'
import { createAiExample, saveAssistantSettings } from '@/services/ai-training'
import { ASSISTANT_LABELS, DEFAULT_MODEL, MODEL_OPTIONS, type Assistant } from '@/lib/ai-assistant'
import { aiAssistantSettings, aiChatLog, aiExamples, type AiAssistantSetting, type AiChatLogRow, type AiExample } from '../../../../../drizzle/schema'
import { AdminShell } from '@/components/admin/AdminShell'
import { ChatKbForm, SELECT_CLASS } from '@/components/admin/ChatKbForm'
import { ChatKbRowActions } from '@/components/admin/ChatKbRowActions'
import { AiExampleActions, PromoteLogButton } from '@/components/admin/AiExampleActions'
import { AiTestChat } from '@/components/admin/AiTestChat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const TABS = [
  { id: 'knowledge', label: 'Kennis' },
  { id: 'instructions', label: 'Instructies' },
  { id: 'examples', label: 'Voorbeelden' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'test', label: 'Testchat' },
  { id: 'usage', label: 'Modellen & gebruik' },
] as const
type TabId = (typeof TABS)[number]['id']

const AUDIENCE_LABELS: Record<string, string> = { public: 'Website', hr: 'HR', both: 'Beide' }
const ASSISTANTS: Assistant[] = ['hr', 'public']

/** Leest tabellen die door migratie 0015 komen; zonder migratie een lege lijst i.p.v. een crash. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

function shorten(text: string | null, max = 140): string {
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default async function ChatKbSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const { tab: tabParam } = await searchParams
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'knowledge'

  return (
    <AdminShell session={session}>
      <h1 className="mb-1 text-lg font-semibold text-foreground">AI-training</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Leer de assistenten: voeg kennis toe, schrijf hun instructies, geef modelantwoorden, probeer ze uit en kies het model.
        Er zijn twee assistenten: de website-chat voor kandidaten en clienten, en de HR-assistent voor medewerkers. Alleen Super
        Admins zien deze pagina.
      </p>

      <nav aria-label="AI-training" className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/settings/chat-kb?tab=${t.id}`}
            aria-current={t.id === tab ? 'page' : undefined}
            className={
              t.id === tab
                ? '-mb-px border-b-2 border-primary px-3 py-2 text-sm font-medium text-foreground'
                : 'px-3 py-2 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'knowledge' && <KnowledgeTab />}
      {tab === 'instructions' && <InstructionsTab />}
      {tab === 'examples' && <ExamplesTab />}
      {tab === 'feedback' && <FeedbackTab />}
      {tab === 'test' && <AiTestChat defaultAssistant="hr" />}
      {tab === 'usage' && <UsageTab />}
    </AdminShell>
  )
}

async function KnowledgeTab() {
  const entries = await listChatKbEntries()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          De kennisbank bevat wat de assistenten mogen gebruiken om te antwoorden. Elk item hoort bij de website-chat, de
          HR-assistent of beide: kennis voor HR wordt nooit aan bezoekers van de website getoond. Alle actieve items gaan
          mee als context; houd ze daarom kort en feitelijk.
        </p>
        <form action={importHrStarterKnowledge}>
          <Button type="submit" variant="outline" size="sm">
            HR-startkennis toevoegen (werkproces)
          </Button>
        </form>
      </div>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Voor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    Nog geen kennisbank-items.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-foreground">{entry.topic}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{AUDIENCE_LABELS[entry.audience] ?? 'Website'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.active ? 'default' : 'secondary'}>{entry.active ? 'Actief' : 'Inactief'}</Badge>
                  </TableCell>
                  <TableCell>
                    <ChatKbRowActions id={entry.id} active={entry.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ChatKbForm defaultAudience="hr" />
      </div>
    </div>
  )
}

async function InstructionsTab() {
  const rows = await safe<AiAssistantSetting[]>(() => db.select().from(aiAssistantSettings), [])
  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Instructies komen bovenop de vaste basisprompt (taal, eerlijkheid, niets verzinnen). Beschrijf toon, werkwijze en
        grenzen, bv. &ldquo;spreek medewerkers aan met u&rdquo; of &ldquo;verwijs bij ziekteverzuim altijd naar de HR-manager&rdquo;.
      </p>
      {ASSISTANTS.map((assistant) => {
        const row = rows.find((r) => r.assistant === assistant)
        return (
          <form key={assistant} action={saveAssistantSettings} className="max-w-3xl space-y-3 rounded-xl border border-border bg-card p-4">
            <input type="hidden" name="assistant" value={assistant} />
            <h2 className="text-sm font-semibold text-foreground">{ASSISTANT_LABELS[assistant]}</h2>
            <div className="space-y-1.5">
              <Label htmlFor={`instructions-${assistant}`}>Eigen instructies</Label>
              <Textarea
                id={`instructions-${assistant}`}
                name="instructions"
                rows={6}
                maxLength={6000}
                defaultValue={row?.instructions ?? ''}
                placeholder="bv. Antwoord in maximaal vijf zinnen. Noem bij elke procedure de bijbehorende status in het systeem."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`model-${assistant}`}>Model</Label>
              <select id={`model-${assistant}`} name="model" defaultValue={row?.model ?? DEFAULT_MODEL} className={`${SELECT_CLASS} max-w-sm`}>
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Opslaan</Button>
          </form>
        )
      })}
    </div>
  )
}

async function ExamplesTab() {
  const examples = await safe<AiExample[]>(() => db.select().from(aiExamples).orderBy(desc(aiExamples.createdAt)), [])
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Voorbeeldantwoorden zijn vraag-en-antwoordparen die de assistent als voorbeeld volgt (toon, opbouw en inhoud). Handig om
        een fout antwoord uit de testchat te corrigeren: geef het gewenste antwoord en het wordt meegenomen.
      </p>
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vraag</TableHead>
                <TableHead>Voor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {examples.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    Nog geen voorbeeldantwoorden.
                  </TableCell>
                </TableRow>
              )}
              {examples.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-foreground">{shorten(ex.question, 90)}</div>
                    <div className="text-xs text-muted-foreground">{shorten(ex.answer, 120)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ex.assistant === 'hr' ? 'HR' : 'Website'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ex.active ? 'default' : 'secondary'}>{ex.active ? 'Actief' : 'Inactief'}</Badge>
                  </TableCell>
                  <TableCell>
                    <AiExampleActions id={ex.id} active={ex.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <form action={createAiExample} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-assistant">Voor welke assistent</Label>
            <select id="ex-assistant" name="assistant" defaultValue="hr" className={SELECT_CLASS}>
              <option value="hr">HR-assistent (medewerkers)</option>
              <option value="public">Website-chat (kandidaten & clienten)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ex-question">Vraag</Label>
            <Input id="ex-question" name="question" required placeholder="bv. Welke documenten moet een kandidaat aanleveren?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ex-answer">Modelantwoord</Label>
            <Textarea id="ex-answer" name="answer" required rows={5} placeholder="Het antwoord zoals de assistent het zou moeten geven…" />
          </div>
          <Button type="submit">Toevoegen</Button>
        </form>
      </div>
    </div>
  )
}

async function FeedbackTab() {
  const logs = await safe<AiChatLogRow[]>(
    () => db.select().from(aiChatLog).where(sql`${aiChatLog.rating} is not null`).orderBy(desc(aiChatLog.createdAt)).limit(100),
    [],
  )
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Antwoorden die je in de testchat hebt beoordeeld. Bij een fout antwoord met een gewenst antwoord kun je het met één klik als
        voorbeeld opslaan, zodat de assistent het de volgende keer goed doet.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beoordeling</TableHead>
              <TableHead>Vraag</TableHead>
              <TableHead>Antwoord van de AI</TableHead>
              <TableHead>Gewenst antwoord</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  Nog geen feedback. Beoordeel antwoorden in de tab Testchat.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant={log.rating === 1 ? 'default' : 'destructive'}>{log.rating === 1 ? 'Goed' : 'Fout'}</Badge>
                  <div className="mt-1 text-xs text-muted-foreground">{log.assistant === 'hr' ? 'HR' : 'Website'}</div>
                </TableCell>
                <TableCell className="max-w-48 whitespace-normal">{shorten(log.question, 120)}</TableCell>
                <TableCell className="max-w-64 whitespace-normal text-muted-foreground">{shorten(log.answer, 180)}</TableCell>
                <TableCell className="max-w-64 whitespace-normal">{shorten(log.note, 180)}</TableCell>
                <TableCell>{log.rating === -1 && log.note ? <PromoteLogButton id={log.id} /> : null}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

async function UsageTab() {
  const [settings, stats, kbEntries, examples] = await Promise.all([
    safe<AiAssistantSetting[]>(() => db.select().from(aiAssistantSettings), []),
    safe(
      () =>
        db
          .select({
            assistant: aiChatLog.assistant,
            model: aiChatLog.model,
            total: count(),
            good: sql<number>`count(*) filter (where ${aiChatLog.rating} = 1)`.mapWith(Number),
            bad: sql<number>`count(*) filter (where ${aiChatLog.rating} = -1)`.mapWith(Number),
          })
          .from(aiChatLog)
          .where(sql`${aiChatLog.createdAt} >= now() - interval '30 days'`)
          .groupBy(aiChatLog.assistant, aiChatLog.model),
      [],
    ),
    listChatKbEntries(),
    safe<AiExample[]>(() => db.select().from(aiExamples).where(eq(aiExamples.active, true)), []),
  ])

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Ingesteld model per assistent</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assistent</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Actieve kennisitems</TableHead>
                <TableHead>Actieve voorbeelden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ASSISTANTS.map((assistant) => {
                const audiences = assistant === 'hr' ? ['hr', 'both'] : ['public', 'both']
                const model = settings.find((s) => s.assistant === assistant)?.model ?? DEFAULT_MODEL
                return (
                  <TableRow key={assistant}>
                    <TableCell className="font-medium text-foreground">{ASSISTANT_LABELS[assistant]}</TableCell>
                    <TableCell>{MODEL_OPTIONS.find((m) => m.id === model)?.label ?? model}</TableCell>
                    <TableCell>{kbEntries.filter((e) => e.active && audiences.includes(e.audience)).length}</TableCell>
                    <TableCell>{examples.filter((e) => e.assistant === assistant).length}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">Het model wijzig je in de tab Instructies.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Gebruik laatste 30 dagen (testchat)</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assistent</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Vragen</TableHead>
                <TableHead>Goed</TableHead>
                <TableHead>Fout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nog geen gebruik.
                  </TableCell>
                </TableRow>
              )}
              {stats.map((s) => (
                <TableRow key={`${s.assistant}-${s.model}`}>
                  <TableCell>{s.assistant === 'hr' ? 'HR-assistent' : 'Website-chat'}</TableCell>
                  <TableCell>{s.model}</TableCell>
                  <TableCell>{s.total}</TableCell>
                  <TableCell>{s.good}</TableCell>
                  <TableCell>{s.bad}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Alleen gesprekken uit de testchat worden vastgelegd. Gesprekken van websitebezoekers worden bewust niet opgeslagen.
        </p>
      </section>
    </div>
  )
}
