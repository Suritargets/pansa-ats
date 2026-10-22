/**
 * vacatures/page.tsx
 * WAT:    Publieke vacaturelijst — de open personeelsaanvragen van clients, zonder klantnaam, met de
 *         functie-eisen per categorie (job scope) en een knop naar het sollicitatieformulier.
 */

import { ChevronRight, Users } from 'lucide-react'
import { CtaLink, EmptyState, Panel, Tag } from '@/components/landing/PublicShell'
import { PublicShell } from '@/components/landing/PublicShell'
import { listPublicVacancies } from '@/services/public'
import { formatDate } from '@/lib/utils'

export default async function VacaturesPage() {
  const vacancies = await listPublicVacancies()

  return (
    <PublicShell
      mode="werkzoeken"
      title="Vacatures"
      intro="Open posities bij onze clients in de industriële, technische en mijnbouwsector. Solliciteer via het registratieformulier — wij nemen contact op zodra er een passende plek is."
    >
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <CtaLink href="/apply">
          Solliciteer nu
          <ChevronRight className="size-5" />
        </CtaLink>
        <p className="text-sm text-white/60">
          Ook zonder passende vacature kun je solliciteren: je komt dan in ons netwerk voor toekomstige plaatsingen.
        </p>
      </div>

      {vacancies.length === 0 ? (
        <EmptyState>Er staan op dit moment geen vacatures open. Solliciteer open en wij nemen contact op.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {vacancies.map((v) => (
            <li key={v.id}>
              <Panel className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl leading-none font-semibold tracking-wide uppercase">{v.title}</h2>
                    <p className="mt-1 text-sm text-white/65">
                      {v.place} · geplaatst {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <Users className="size-4" />
                    {v.quantity}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Tag>{v.branche}</Tag>
                  {v.isNew && <Tag tone="mode">Nieuw</Tag>}
                </div>
                {v.requirements.length > 0 && (
                  <dl className="mt-1 space-y-1.5 text-sm">
                    {v.requirements.map((r, i) => (
                      <div key={i} className="flex gap-2">
                        <dt className="w-32 shrink-0 text-white/60">{r.category}</dt>
                        <dd className="text-white/90">{r.requirement}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <CtaLink href="/apply">Solliciteer</CtaLink>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </PublicShell>
  )
}
