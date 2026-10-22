/**
 * talentenpool/page.tsx
 * WAT:    Voor bedrijven: hoeveel beschikbare kandidaten er per functie in ons netwerk zitten —
 *         uitsluitend aantallen. Profielen zelf zijn alleen zichtbaar in het klantportaal, nadat HR ze
 *         met de client gedeeld heeft.
 */

import { ChevronRight, Lock } from 'lucide-react'
import { CtaLink, EmptyState, Panel, PanelTitle, PublicShell, Tag } from '@/components/landing/PublicShell'
import { getTalentPool } from '@/services/public'

export default async function TalentenpoolPage() {
  const { rows, total } = await getTalentPool()

  return (
    <PublicShell
      mode="bedrijven"
      title="Talentenpool"
      intro="Gescreende kandidaten uit de industriële, technische en mijnbouwsector — met geverifieerde documenten, referentiecheck en medische keuring vóór plaatsing."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <PanelTitle>Beschikbaar per functie</PanelTitle>
            <span className="font-heading text-3xl leading-none text-[var(--mode)]">{total}</span>
          </div>
          {rows.length === 0 ? (
            <EmptyState>Nog geen kandidaten om te tonen. Plaats een vacature en wij zoeken in ons netwerk.</EmptyState>
          ) : (
            <Panel className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs tracking-wider text-white/60 uppercase">
                    <th className="px-5 py-3 font-medium">Functie</th>
                    <th className="px-5 py-3 font-medium">Branche</th>
                    <th className="px-5 py-3 text-right font-medium">Beschikbaar</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.category} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 font-semibold">{r.category}</td>
                      <td className="px-5 py-3">
                        <Tag>{r.branche}</Tag>
                      </td>
                      <td className="px-5 py-3 text-right font-heading text-xl leading-none text-[var(--mode)]">{r.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel className="flex flex-col gap-3">
            <Lock className="size-6 text-[var(--mode)]" />
            <PanelTitle>Profielen bekijken</PanelTitle>
            <p className="text-sm text-white/80">
              Kandidaatprofielen en CV&apos;s delen we alleen via het klantportaal, na een aanvraag. Zo blijven
              persoonsgegevens beschermd en krijgt u alleen kandidaten die bij uw job scope passen.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <CtaLink href="/request-staffing">
                Plaats een vacature
                <ChevronRight className="size-5" />
              </CtaLink>
              <CtaLink href="/client">Klantportaal</CtaLink>
            </div>
          </Panel>
        </div>
      </div>
    </PublicShell>
  )
}
