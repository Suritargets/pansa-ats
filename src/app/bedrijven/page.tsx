/**
 * bedrijven/page.tsx
 * WAT:    Onze ondernemingen (Pansa Group + dochterbedrijven) en contactgegevens.
 */

import { Building2, ChevronRight } from 'lucide-react'
import { CtaLink, Panel, PanelTitle, PublicShell } from '@/components/landing/PublicShell'
import { PANSA_SUBSIDIARIES } from '@/constants/companies'

const DETAILS: Record<string, string> = {
  hpsnv:
    'Werft, selecteert en plaatst manpower voor industriële mijnbouwclients zoals ZIJIN-RGM: operators, monteurs, lassers, elektriciens, catering, beveiliging en administratie. Verzorgt het volledige HR-traject van registratie tot inductie en begeleiding on site.',
  'machine-shop': 'Machinale bewerking, reparatie en fabricage voor de industrie.',
  industries: 'Industriële operaties en projecten binnen de Pansa Group.',
}

export default function BedrijvenPage() {
  return (
    <PublicShell
      mode="werkzoeken"
      title="Onze ondernemingen"
      intro="Pansa Group of Companies N.V. is de holding van drie bedrijven die samen personeel, techniek en industriële diensten leveren — the moving force of the industries."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {PANSA_SUBSIDIARIES.map((c) => (
          <li key={c.slug}>
            <Panel className="flex h-full flex-col gap-3">
              <Building2 className="size-7 text-[var(--mode)]" />
              <h2 className="font-heading text-2xl leading-none font-semibold tracking-wide uppercase">{c.name}</h2>
              <p className="text-sm font-medium text-white/85">{c.tagline}</p>
              <p className="text-sm text-white/70">{DETAILS[c.slug]}</p>
            </Panel>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Panel>
          <PanelTitle>Contact</PanelTitle>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex gap-3"><dt className="w-28 text-white/60">Adres</dt><dd>Martin Luther Kingweg km 23, Para, Suriname</dd></div>
            <div className="flex gap-3"><dt className="w-28 text-white/60">Telefoon</dt><dd>+597 323451 · mobiel +597 7698051</dd></div>
            <div className="flex gap-3"><dt className="w-28 text-white/60">Sollicitaties</dt><dd>recruitment@hpsnv.com</dd></div>
            <div className="flex gap-3"><dt className="w-28 text-white/60">HR</dt><dd>humanresource@hpsnv.com</dd></div>
            <div className="flex gap-3"><dt className="w-28 text-white/60">Website</dt><dd>www.hpsnv.com · @pansaholding</dd></div>
            <div className="flex gap-3"><dt className="w-28 text-white/60">K.K.F.</dt><dd>dossier 30028</dd></div>
          </dl>
        </Panel>
        <Panel className="flex flex-col justify-center gap-4">
          <PanelTitle>Werken bij of met Pansa?</PanelTitle>
          <div className="flex flex-wrap gap-3">
            <CtaLink href="/apply">
              Solliciteer
              <ChevronRight className="size-5" />
            </CtaLink>
            <CtaLink href="/request-staffing">
              Personeel aanvragen
              <ChevronRight className="size-5" />
            </CtaLink>
          </div>
        </Panel>
      </div>
    </PublicShell>
  )
}
