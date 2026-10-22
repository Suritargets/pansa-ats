/**
 * nieuws/page.tsx
 * WAT:    "Laatste vacatures en updates": afgeleid uit wat er recent bijkwam (vacatures, trainingen) —
 *         er is geen aparte nieuwstabel. Plus vaste praktische informatie voor sollicitanten.
 */

import Link from 'next/link'
import { Briefcase, ChevronRight, GraduationCap } from 'lucide-react'
import { EmptyState, Panel, PanelTitle, PublicShell } from '@/components/landing/PublicShell'
import { listPublicNews } from '@/services/public'
import { formatDate } from '@/lib/utils'

const REQUIRED_DOCUMENTS = [
  'Kopie bewijs van goed gedrag (geldig)',
  'Kopie ID-kaart en rijbewijs',
  "Diploma's, cijferlijsten, rapporten en certificaten",
  'Pasfoto, uittreksel en kopie familieboek',
  'Referentiebrief van je vorige werkgever',
  'Originele stukken ter verificatie',
]

export default async function NieuwsPage() {
  const items = await listPublicNews()

  return (
    <PublicShell mode="werkzoeken" title="Nieuws" intro="Nieuwe vacatures, trainingen en praktische informatie voor sollicitanten.">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <PanelTitle>Laatste updates</PanelTitle>
          {items.length === 0 ? (
            <EmptyState>Nog geen updates. Kom later terug of solliciteer alvast.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="clip-tech-sm flex items-center gap-4 border border-white/10 bg-[#121812] p-4 hover:bg-white/5">
                    {item.kind === 'vacature' ? (
                      <Briefcase className="size-6 shrink-0 text-[var(--mode)]" />
                    ) : (
                      <GraduationCap className="size-6 shrink-0 text-[var(--mode)]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{item.title}</span>
                      <span className="block text-sm text-white/65">
                        {item.text && `${item.text} · `}
                        {formatDate(item.date)}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-white/60" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <PanelTitle>Solliciteren bij Pansa</PanelTitle>
          <Panel>
            <p className="text-sm text-white/80">
              Na je sollicitatie ontvang je via WhatsApp bericht over de stukken die we nodig hebben en over
              je gesprek. Neem mee:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/80">
              {REQUIRED_DOCUMENTS.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-white/60">
              Hoofdkantoor: Martin Luther Kingweg km 23, Para · +597 323451 · recruitment@hpsnv.com
            </p>
          </Panel>
        </div>
      </div>
    </PublicShell>
  )
}
