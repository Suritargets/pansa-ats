/**
 * candidate/home/page.tsx
 * WAT:    Kandidaat-home (mobiel ontwerp 02): begroeting met foto, zoekbalk, populaire categorieën met
 *         aantal open vacatures en de nieuwste vacatures.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getCandidateById } from '@/services/queries'
import { countByBranche, listOwnApplications, listPublicVacancies } from '@/services/public'
import { PortalShell, SectionTitle, WhiteCard } from '@/components/portal/PortalShell'
import { VacancyCard } from '@/components/portal/VacancyCard'
import { LogoMark } from '@/components/landing/LogoMark'
import { logoSrc } from '@/components/landing/PublicShell'
import { Avatar } from '@/components/admin/Avatar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { branchePhoto } from '@/constants/photos'

export default async function CandidateHomePage() {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const [candidate, vacancies, own] = await Promise.all([
    getCandidateById(session.candidateId),
    listPublicVacancies(),
    listOwnApplications(session.candidateId),
  ])
  if (!candidate) redirect('/candidate')

  const categories = countByBranche(vacancies).slice(0, 4)
  const latestApplication = own[0] ?? null

  return (
    <PortalShell
      variant="candidate"
      session={session}
      title={`Hallo, ${candidate.firstName}`}
      hero={
        <header
          className="relative px-4 pt-4 pb-5"
          style={{ backgroundImage: 'linear-gradient(180deg,rgba(11,16,12,.25),#0b100c),url(/landing/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-heading text-lg font-semibold tracking-wide">
              <LogoMark src={logoSrc()} size={34} />
              PANSA GROUP <span className="font-normal text-white/70">ATS</span>
            </span>
            <Link href="/candidate/profile" aria-label="Mijn profiel">
              <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="sm" />
            </Link>
          </div>
          <p className="mt-6 text-white/80">Hallo,</p>
          <p className="font-sans text-4xl font-black">{candidate.firstName}</p>
          <p className="mt-1 text-white/85">Vind jouw volgende baan bij Pansa Group.</p>
        </header>
      }
    >
      <form action="/vacatures" className="-mt-1 flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-3 text-[#10150f]">
          <Search className="size-4 shrink-0 text-[#5b6558]" />
          <input name="q" placeholder="Zoek vacatures…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a9486]" />
        </label>
        <Link href="/vacatures" aria-label="Filters" className="flex size-12 items-center justify-center rounded-xl bg-white text-[#10150f]">
          <SlidersHorizontal className="size-5" />
        </Link>
      </form>

      {latestApplication && (
        <Link href="/candidate/dashboard" className="mt-4 block">
          <WhiteCard className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-xs text-[#5b6558]">Mijn laatste sollicitatie</span>
              <span className="block font-bold">{latestApplication.positionApplied}</span>
              <span className="block text-xs text-[#5b6558]">{latestApplication.companyName}</span>
            </span>
            <StatusBadge status={latestApplication.status} />
          </WhiteCard>
        </Link>
      )}

      <SectionTitle title="Populaire categorieën" href="/vacatures" />
      {categories.length === 0 ? (
        <p className="text-sm text-white/65">Er staan op dit moment geen vacatures open.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <li key={c.branche}>
              <Link
                href={`/vacatures?branche=${encodeURIComponent(c.branche)}`}
                className="relative flex h-24 flex-col justify-end overflow-hidden rounded-2xl border border-[var(--color-brand-green)]/50 bg-cover bg-center p-3"
                style={{ backgroundImage: `linear-gradient(180deg,rgba(11,16,12,.1),rgba(11,16,12,.85)),url(${branchePhoto(c.brancheKey)})` }}
              >
                <span className="font-bold">{c.branche}</span>
                <span className="text-xs text-[var(--color-brand-lime)]">
                  {c.count} {c.count === 1 ? 'vacature' : 'vacatures'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle title="Nieuwste vacatures" href="/vacatures" />
      {vacancies.length === 0 ? (
        <p className="text-sm text-white/65">Nog geen vacatures. Je kunt je profiel alvast aanvullen.</p>
      ) : (
        <ul className="space-y-3">
          {vacancies.slice(0, 3).map((v) => (
            <li key={v.id}>
              <VacancyCard vacancy={v} compact />
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  )
}
