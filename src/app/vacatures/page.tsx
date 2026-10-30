/**
 * vacatures/page.tsx
 * WAT:    Vacaturelijst (mobiel ontwerp 03): zoekbalk, filterchips per branche, aantal gevonden, sorteren,
 *         vacaturekaarten met foto. Voor iedereen zichtbaar; de onderbalk verwijst anonieme bezoekers
 *         voor Home/Sollicitaties/Profiel naar de login.
 * WAAROM: Bron zijn de open personeelsaanvragen van clients, zonder klantnaam en zonder persoonsgegevens.
 */

import Link from 'next/link'
import { ArrowDownUp, ChevronRight, Search } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { listPublicVacancies } from '@/services/public'
import { PortalShell, ChipBar } from '@/components/portal/PortalShell'
import { VacancyCard } from '@/components/portal/VacancyCard'

export default async function VacaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ branche?: string; q?: string; sort?: string }>
}) {
  const { branche, q, sort } = await searchParams
  const [session, all] = await Promise.all([getSession(), listPublicVacancies()])

  const brancheNames = [...new Set(all.map((v) => v.branche))].sort()
  const query = q?.trim().toLowerCase() ?? ''
  const filtered = all
    .filter((v) => !branche || v.branche === branche)
    .filter((v) => !query || `${v.title} ${v.branche} ${v.place}`.toLowerCase().includes(query))
  const vacancies = sort === 'az' ? [...filtered].sort((a, b) => a.title.localeCompare(b.title)) : filtered

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const next = { branche, q, sort, ...patch }
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value)
    const qs = params.toString()
    return `/vacatures${qs ? `?${qs}` : ''}`
  }

  const candidateSession = session?.role === 'candidate' ? session : null

  return (
    <PortalShell
      variant="candidate"
      session={candidateSession}
      title="Vacatures"
      back={candidateSession ? '/candidate/home' : '/'}
      action={
        <Link href="#zoek" aria-label="Zoeken" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          <Search className="size-5" />
        </Link>
      }
    >
      <form id="zoek" action="/vacatures" className="mb-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[#10150f]">
        <Search className="size-4 shrink-0 text-[#5b6558]" />
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Zoek vacatures…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a9486]"
        />
        {branche && <input type="hidden" name="branche" value={branche} />}
        <button type="submit" className="text-sm font-semibold text-[#1c9848]">
          Zoek
        </button>
      </form>

      <ChipBar
        chips={[
          { label: 'Alle', href: href({ branche: undefined }), active: !branche },
          ...brancheNames.map((name) => ({ label: name, href: href({ branche: name }), active: branche === name })),
        ]}
      />

      <div className="mt-4 mb-3 flex items-center justify-between">
        <p className="text-sm text-white/75">
          {vacancies.length} {vacancies.length === 1 ? 'vacature' : 'vacatures'} gevonden
        </p>
        <Link
          href={href({ sort: sort === 'az' ? undefined : 'az' })}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/15"
        >
          <ArrowDownUp className="size-3.5" />
          {sort === 'az' ? 'Nieuwste eerst' : 'A–Z'}
        </Link>
      </div>

      {vacancies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center">
          <p className="text-white/85">Geen vacatures gevonden{branche || query ? ' met deze filters' : ''}.</p>
          <p className="mt-1 text-sm text-white/60">Solliciteer open — we nemen contact op zodra er een passende plek is.</p>
          <Link
            href="/apply"
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-[var(--color-brand-lime)] px-4 py-2.5 text-sm font-bold text-[#0b100c]"
          >
            Open solliciteren
            <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {vacancies.map((vacancy) => (
            <li key={vacancy.id}>
              <VacancyCard vacancy={vacancy} />
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  )
}
