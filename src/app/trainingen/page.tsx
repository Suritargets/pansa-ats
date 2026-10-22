/**
 * trainingen/page.tsx
 * WAT:    Publieke trainingscatalogus (tabel `trainings`, beheerd via /admin/trainings) + wat een
 *         nieuwe medewerker standaard doorloopt (inductie, uit het introductieproces).
 */

import { GraduationCap } from 'lucide-react'
import { EmptyState, Panel, PanelTitle, PublicShell, Tag } from '@/components/landing/PublicShell'
import { listPublicTrainings } from '@/services/public'

const INDUCTIONS = [
  ['HR-inductie', 'Personeelsgids, rechten en plichten, verlof en ziekmelding, betaalschema.'],
  ['OHSEQ-inductie', 'Gezondheid, arbeidsveiligheid, milieu en kwaliteit op de werkplek; PPE-uitgifte.'],
  ['Afdelingsinductie', 'Afdelingsbeschrijving, processen en procedures van jouw functie.'],
  ['Client-inductie', 'Inductietraining op de locatie van de client (voor plaatsing bij RGM verplicht).'],
] as const

export default async function TrainingenPage() {
  const trainings = await listPublicTrainings()

  return (
    <PublicShell
      mode="werkzoeken"
      title="Trainingen"
      intro="Pansa Group investeert in vakbekwaamheid: her- en bijscholing op kosten van de werkgever, en een vaste inductie voor elke nieuwe medewerker."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <PanelTitle>Trainingsaanbod</PanelTitle>
          {trainings.length === 0 ? (
            <EmptyState>Het trainingsaanbod wordt binnenkort gepubliceerd. Vraag ernaar tijdens je sollicitatiegesprek.</EmptyState>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {trainings.map((t) => (
                <li key={t.id}>
                  <Panel className="flex h-full flex-col gap-2">
                    <GraduationCap className="size-6 text-[var(--mode)]" />
                    <h3 className="font-heading text-xl leading-none font-semibold tracking-wide uppercase">{t.title}</h3>
                    {t.description && <p className="text-sm text-white/80">{t.description}</p>}
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                      {t.standard && <Tag>{t.standard}</Tag>}
                      {t.durationHours && <Tag>{t.durationHours} uur</Tag>}
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <PanelTitle>Inductie voor nieuwe medewerkers</PanelTitle>
          <Panel>
            <p className="text-sm text-white/70">
              Interne inductiedagen: maandag, woensdag en vrijdag op het hoofdkantoor in Para.
            </p>
            <ol className="mt-4 space-y-3">
              {INDUCTIONS.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="font-heading text-lg leading-none text-[var(--mode)]">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-white/70">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </PublicShell>
  )
}
