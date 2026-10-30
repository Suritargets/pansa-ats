/**
 * candidate/dashboard/page.tsx
 * WAT:    "Mijn sollicitaties" (mobiel ontwerp 05): filterchips (Alle / In behandeling / Geplaatst /
 *         Afgewezen), kaarten met foto, functie, bedrijf, status en datum, en onder de lijst de voortgang
 *         van de laatste sollicitatie.
 * WAAROM: Alleen eigen data: alles hangt aan `session.candidateId`. Interviewscores blijven intern.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, MapPin } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { listInterviews } from '@/services/queries'
import { listOwnApplications, type OwnApplication } from '@/services/public'
import { PortalShell, ChipBar, WhiteCard } from '@/components/portal/PortalShell'
import { ProgressDashboard } from '@/components/candidate/ProgressDashboard'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { branchePhoto } from '@/constants/photos'
import { daysSince, formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types/database'

const GROUPS: Record<string, { label: string; statuses: ApplicationStatus[] }> = {
  behandeling: { label: 'In behandeling', statuses: ['new', 'in_review', 'shortlisted', 'interview', 'offer'] },
  geplaatst: { label: 'Geplaatst', statuses: ['onboarding', 'active'] },
  afgewezen: { label: 'Afgewezen', statuses: ['rejected', 'withdrawn'] },
}

export default async function CandidateDashboardPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const { filter } = await searchParams
  const all = await listOwnApplications(session.candidateId)
  const group = filter ? GROUPS[filter] : undefined
  const shown = group ? all.filter((a) => group.statuses.includes(a.status)) : all
  const latest = all[0] ?? null
  const interviews = latest ? await listInterviews(latest.id) : []

  const count = (key: string) => all.filter((a) => GROUPS[key].statuses.includes(a.status)).length

  return (
    <PortalShell variant="candidate" session={session} title="Mijn sollicitaties" back="/candidate/home">
      <ChipBar
        chips={[
          { label: `Alle (${all.length})`, href: '/candidate/dashboard', active: !group },
          ...Object.entries(GROUPS).map(([key, g]) => ({
            label: `${g.label} (${count(key)})`,
            href: `/candidate/dashboard?filter=${key}`,
            active: filter === key,
          })),
        ]}
      />

      {all.length === 0 ? (
        <WhiteCard className="mt-4 text-center">
          <p className="font-semibold">Je hebt nog niet gesolliciteerd.</p>
          <p className="mt-1 text-sm text-[#5b6558]">Bekijk de vacatures of solliciteer open — dan nemen wij contact op.</p>
          <Link href="/vacatures" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#1c9848] px-4 py-2.5 text-sm font-bold text-white">
            Naar vacatures
            <ChevronRight className="size-4" />
          </Link>
        </WhiteCard>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.length === 0 && <li className="text-sm text-white/65">Geen sollicitaties in deze groep.</li>}
          {shown.map((app) => (
            <li key={app.id}>
              <ApplicationRow app={app} />
            </li>
          ))}
        </ul>
      )}

      {latest && (
        <div className="mt-8">
          <h2 className="mb-3 font-sans text-lg font-bold">Voortgang — {latest.positionApplied}</h2>
          <div className="rounded-2xl bg-white p-1 text-[#10150f]">
            <ProgressDashboard status={latest.status} daysSinceApplied={daysSince(latest.createdAt)} interviewCount={interviews.length} />
          </div>
        </div>
      )}
    </PortalShell>
  )
}

function ApplicationRow({ app }: { app: OwnApplication }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm">
      <span
        aria-hidden="true"
        className="size-16 shrink-0 rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${branchePhoto(app.brancheKey)}), linear-gradient(160deg,#2a3324,#0f1510)` }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{app.positionApplied}</span>
        <span className="block truncate text-sm text-[#5b6558]">{app.companyName}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-[#5b6558]">
          <MapPin className="size-3" />
          Suriname · {formatDate(app.createdAt)}
        </span>
      </span>
      <StatusBadge status={app.status} />
    </div>
  )
}
