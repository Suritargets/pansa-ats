/**
 * vacatures/[id]/page.tsx
 * WAT:    Vacaturedetail (mobiel ontwerp 04): foto-kop met terug/delen, titel + "Nieuw", plaats, tags,
 *         functieomschrijving, vereisten (job scope van de client) en een vaste "Solliciteer nu"-knop.
 * WAAROM: Er is geen vrije omschrijving per aanvraag opgeslagen (de notities van de client zijn intern en
 *         worden nooit getoond). De omschrijving is daarom een neutrale tekst per branche; de vereisten
 *         komen uit de gestructureerde job scope.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, ChevronLeft, MapPin, Send, Tag, Clock } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getPublicVacancy } from '@/services/public'
import { PortalShell } from '@/components/portal/PortalShell'
import { daysAgoLabel } from '@/components/portal/VacancyCard'
import { branchePhoto } from '@/constants/photos'

export default async function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, vacancy] = await Promise.all([getSession(), getPublicVacancy(id)])
  if (!vacancy) notFound()
  const candidateSession = session?.role === 'candidate' ? session : null

  return (
    <PortalShell
      variant="candidate"
      session={candidateSession}
      bottomNav={false}
      title={vacancy.title}
      hero={
        <div
          className="relative h-56 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(180deg,rgba(11,16,12,.15) 0%,rgba(11,16,12,0) 45%,#0b100c 100%), url(${branchePhoto(vacancy.brancheKey)}), linear-gradient(160deg,#2a3324,#0f1510)` }}
        >
          <Link href="/vacatures" aria-label="Terug naar vacatures" className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur">
            <ChevronLeft className="size-6" />
          </Link>
        </div>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-sans text-3xl leading-tight font-black">{vacancy.title}</h1>
        {vacancy.isNew && (
          <span className="mt-1 shrink-0 rounded-md bg-[var(--color-brand-lime)] px-2.5 py-1 text-xs font-bold text-[#0b100c]">Nieuw</span>
        )}
      </div>
      <p className="mt-1 text-lg font-semibold text-[var(--color-brand-lime)]">{vacancy.place}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm text-white/75">
        <MapPin className="size-3.5" />
        Suriname
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
          <Tag className="size-3.5" />
          {vacancy.branche}
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
          <Clock className="size-3.5" />
          {daysAgoLabel(vacancy.createdAt)}
        </span>
        {vacancy.quantity > 1 && <span className="rounded-lg bg-white/10 px-3 py-1.5">{vacancy.quantity} plekken</span>}
      </div>

      <h2 className="mt-7 font-sans text-xl font-bold">Functieomschrijving</h2>
      <p className="mt-2 leading-relaxed text-white/85">
        Als {vacancy.title.toLowerCase()} werk je in de sector {vacancy.branche.toLowerCase()} bij een van de clients van CCC H. Pansa &amp; Sons N.V.
        Pansa begeleidt je van registratie tot inductie en de eerste werkdagen on site. De exacte taken en het rooster bespreken we tijdens je
        sollicitatiegesprek.
      </p>

      <h2 className="mt-7 font-sans text-xl font-bold">Vereisten</h2>
      {vacancy.requirements.length === 0 ? (
        <p className="mt-2 text-white/75">De client heeft nog geen specifieke eisen opgegeven. Geldig bewijs van goed gedrag en ID zijn altijd vereist.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {vacancy.requirements.map((requirement, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-lime)] text-[#0b100c]">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span>
                <span className="text-sm text-white/60">{requirement.category}</span>
                <span className="block text-white/90">{requirement.requirement}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#0b100c] via-[#0b100c]/95 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mt-8 md:bg-none md:p-0">
        <Link
          href="/apply"
          className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-lime)] px-6 py-4 text-lg font-bold text-[#0b100c] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          <Send className="size-5" />
          Solliciteer nu
        </Link>
      </div>
    </PortalShell>
  )
}
