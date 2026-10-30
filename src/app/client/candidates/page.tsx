/**
 * client/candidates/page.tsx
 * WAT:    Kandidaten-overzicht voor de client (mobiel ontwerp 08): filterchips (Alle / Shortlist /
 *         Gesprek / Geplaatst), lijst van gedeelde profielen met avatar, functie en status.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { listSharedApplicationsForClient } from '@/services/queries'
import { PortalShell, ChipBar, WhiteCard } from '@/components/portal/PortalShell'
import { Avatar } from '@/components/admin/Avatar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types/database'

const FILTERS: Record<string, { label: string; statuses: ApplicationStatus[] }> = {
  shortlist: { label: 'Shortlist', statuses: ['shortlisted'] },
  gesprek: { label: 'Gesprek', statuses: ['interview', 'offer'] },
  geplaatst: { label: 'Geplaatst', statuses: ['onboarding', 'active'] },
}

export default async function ClientCandidatesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { filter } = await searchParams
  const all = await listSharedApplicationsForClient(session.clientId)
  const active = filter ? FILTERS[filter] : undefined
  const shown = active ? all.filter((a) => active.statuses.includes(a.status)) : all

  return (
    <PortalShell variant="client" session={session} wide title="Kandidaten" back="/client/dashboard">
      <ChipBar
        chips={[
          { label: `Alle (${all.length})`, href: '/client/candidates', active: !active },
          ...Object.entries(FILTERS).map(([key, f]) => ({
            label: f.label,
            href: `/client/candidates?filter=${key}`,
            active: filter === key,
          })),
        ]}
      />

      {shown.length === 0 ? (
        <WhiteCard className="mt-4 text-sm text-[#5b6558]">
          {all.length === 0 ? 'Nog geen profielen met u gedeeld.' : 'Geen kandidaten in deze groep.'}
        </WhiteCard>
      ) : (
        <ul className="mt-4 space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {shown.map((app) => (
            <li key={app.id}>
              <Link href={`/client/applications/${app.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm">
                <Avatar name={`${app.candidate.firstName} ${app.candidate.lastName}`} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {app.candidate.firstName} {app.candidate.lastName}
                  </span>
                  <span className="block truncate text-sm text-[#5b6558]">{app.positionApplied}</span>
                  <span className="block text-xs text-[#8a9486]">Gedeeld {formatDate(app.share.sharedAt)}</span>
                </span>
                <StatusBadge status={app.status} />
                <ChevronRight className="size-4 shrink-0 text-[#8a9486]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  )
}
