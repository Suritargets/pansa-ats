/**
 * UsageTab.tsx
 * WAT:    Tab "Modellen & gebruik" van AI-training: verbinding met het AI Gateway, modellen en limieten
 *         (model per assistent, OCR-model, maandbudget, temperatuur) en het verbruik van deze maand.
 */

import { count, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { saveAiLimits } from '@/services/ai-training'
import { DEFAULT_MODEL, getGlobalAiSettings, listModelChoices, monthSpendUsd, type Assistant } from '@/lib/ai-assistant'
import { aiAssistantSettings, aiUsage, type AiAssistantSetting } from '../../../../../drizzle/schema'
import { AiConnectionTest } from '@/components/admin/AiConnectionTest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const FEATURE_LABELS: Record<string, string> = {
  public: 'Website-chat',
  hr: 'HR-assistent',
  test: 'Testchat',
  ocr: 'Digitaliseren (OCR)',
}

/** Leest tabellen uit migratie 0015/0016; zonder migratie een lege lijst i.p.v. een crash. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

function gatewayAuth(): { ok: boolean; how: string } {
  if (process.env.AI_GATEWAY_API_KEY) return { ok: true, how: 'API-sleutel (AI_GATEWAY_API_KEY)' }
  if (process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL) return { ok: true, how: 'Vercel OIDC-token (automatisch op Vercel)' }
  return { ok: false, how: '' }
}

function ModelInput({ id, name, value }: { id: string; name: string; value: string }) {
  return <Input id={id} name={name} list="ai-model-choices" defaultValue={value} placeholder="leverancier/modelnaam" autoComplete="off" spellCheck={false} />
}

export async function UsageTab() {
  const [settings, global, spent, usage, choices] = await Promise.all([
    safe<AiAssistantSetting[]>(() => db.select().from(aiAssistantSettings), []),
    getGlobalAiSettings(),
    safe(() => monthSpendUsd(), 0),
    safe(
      () =>
        db
          .select({
            feature: aiUsage.feature,
            model: aiUsage.model,
            calls: count(),
            input: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)`.mapWith(Number),
            output: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)`.mapWith(Number),
            cost: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)`.mapWith(Number),
            unknownCost: sql<number>`count(*) filter (where ${aiUsage.costUsd} is null)`.mapWith(Number),
          })
          .from(aiUsage)
          .where(sql`${aiUsage.createdAt} >= date_trunc('month', now())`)
          .groupBy(aiUsage.feature, aiUsage.model),
      [],
    ),
    listModelChoices(),
  ])
  const auth = gatewayAuth()
  const modelOf = (a: Assistant) => settings.find((s) => s.assistant === a)?.model ?? DEFAULT_MODEL

  return (
    <div className="max-w-5xl space-y-8">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Verbinding met het AI Gateway</h2>
        <p className={auth.ok ? 'text-sm text-emerald-700 dark:text-emerald-400' : 'text-sm text-destructive'}>
          {auth.ok ? `✓ Authenticatie: ${auth.how}` : '✕ Geen AI-sleutel gevonden op de server.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Chat en OCR lopen via het Vercel AI Gateway. De server leest AI_GATEWAY_API_KEY uit de omgeving (.env.local lokaal, Vercel in
          productie); op Vercel gaat het automatisch via OIDC. De sleutel wordt nooit in de database opgeslagen of naar de browser
          gestuurd.
        </p>
        <AiConnectionTest />
      </section>

      <form action={saveAiLimits} className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Modellen en limieten</h2>
          <p className="text-sm text-muted-foreground">
            Kies een model uit de lijst (begin te typen om te zoeken) of typ zelf een model-ID in de vorm leverancier/modelnaam. Alle
            taalmodellen van het AI Gateway zijn toegestaan{choices.live ? ` (${choices.models.length} beschikbaar)` : '; de actuele lijst kon nu niet worden opgehaald, dit zijn de vaste voorstellen'}.
            Controleer een nieuw model met &ldquo;Verbinding testen&rdquo;.
          </p>
          <datalist id="ai-model-choices">
            {choices.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </datalist>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="model-hr">Model HR-assistent</Label>
            <ModelInput id="model-hr" name="model-hr" value={modelOf('hr')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model-public">Model website-chat</Label>
            <ModelInput id="model-public" name="model-public" value={modelOf('public')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ocrModel">Model OCR (formulieren scannen)</Label>
            <ModelInput id="ocrModel" name="ocrModel" value={global.ocrModel} />
            <p className="text-xs text-muted-foreground">Moet afbeeldingen of PDF&apos;s kunnen lezen (een model met vision).</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthlyBudgetUsd">Maandbudget (USD)</Label>
            <Input id="monthlyBudgetUsd" name="monthlyBudgetUsd" inputMode="decimal" defaultValue={global.monthlyBudgetUsd ?? ''} placeholder="Geen limiet" />
            <p className="text-xs text-muted-foreground">Is het budget op, dan staan chat en OCR stil tot de volgende maand. Leeg = geen limiet.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temperature">Temperatuur</Label>
            <Input id="temperature" name="temperature" inputMode="decimal" defaultValue={global.temperature ?? ''} placeholder="Standaard" />
            <p className="text-xs text-muted-foreground">0 = rustig en voorspelbaar, 2 = creatief. Leeg = standaard van het model.</p>
          </div>
        </div>
        <Button type="submit">Modellen en limieten opslaan</Button>
      </form>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Gebruik deze maand</h2>
          <p className="text-sm text-muted-foreground">Alleen het aantal tokens en de kosten worden bewaard, nooit de vragen of antwoorden.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Onderdeel</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Aanroepen</TableHead>
                <TableHead>Tokens in</TableHead>
                <TableHead>Tokens uit</TableHead>
                <TableHead>Kosten (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usage.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    Deze maand nog geen gebruik.
                  </TableCell>
                </TableRow>
              )}
              {usage.map((u) => (
                <TableRow key={`${u.feature}-${u.model}`}>
                  <TableCell className="font-medium text-foreground">{FEATURE_LABELS[u.feature] ?? u.feature}</TableCell>
                  <TableCell>{u.model}</TableCell>
                  <TableCell>{u.calls}</TableCell>
                  <TableCell>{u.input.toLocaleString('nl-NL')}</TableCell>
                  <TableCell>{u.output.toLocaleString('nl-NL')}</TableCell>
                  <TableCell>{u.unknownCost === u.calls ? 'onbekend' : u.cost.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-foreground">
          Uitgegeven deze maand: ${spent.toFixed(4)}.{' '}
          {global.monthlyBudgetUsd === undefined ? 'Geen budget ingesteld.' : `Budget: $${global.monthlyBudgetUsd.toFixed(2)}.`}
        </p>
        <p className="text-xs text-muted-foreground">
          Kosten komen van het AI Gateway; geeft een aanroep geen kosten terug, dan telt die niet mee voor het budget.
        </p>
      </section>
    </div>
  )
}
