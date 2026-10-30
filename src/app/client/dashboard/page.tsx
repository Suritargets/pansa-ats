/**
 * client/dashboard/page.tsx
 * WAT:    Bedrijvendashboard (mobiel ontwerp 07): begroeting, vier tegels (gedeelde profielen, geplaatst,
 *         open aanvragen, in onboarding), recente gedeelde sollicitaties met status.
 * WAAROM: Een client ziet uitsluitend wat met hem gedeeld is en zijn eigen aanvragen — `session.clientId`.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Briefcase, ChevronRight, ClipboardList, UserCheck, Users } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getClientById, listOwnVacancyRequestsForClient, listSharedApplicationsForClient } from '@/services/queries'
import { PortalShell, SectionTitle, StatTile, WhiteCard } from '@/components/portal/PortalShell'
import { Avatar } from '@/components/admin/Avatar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/utils'

export default async function ClientDashboardPage() {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const [client, applications, requests] = await Promise.all([
    getClientById(session.clientId),
    listSharedApplicationsForClient(session.clientId),
    listOwnVacancyRequestsForClient(session.clientId),
  ])

  const placed = applications.filter((a) => a.status === 'active').length
  const onboarding = applications.filter((a) => a.status === 'onboarding').length
  const openRequests = requests.filter((r) => ['submitted', 'reviewing', 'approved'].includes(r.status)).length

  return (
    <PortalShell
      variant="client"
      session={session}
      wide
      title="Bedrijvendashboard"
      hero={
        <header
          className="px-4 pt-4 pb-5"
          style={{ backgroundImage: 'linear-gradient(180deg,rgba(11,16,12,.25),#0b100c),url(/landing/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <p className="text-sm text-white/70">{client?.name ?? 'Klantportaal'}</p>
          <h1 className="font-sans text-3xl font-black">Bedrijvendashboard</h1>
          <p className="mt-1 text-sm text-white/80">Beheer vacatures, kandidaten en plaatsingen.</p>
        </header>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={ClipboardList} value={applications.length} label="Gedeelde profielen" />
        <StatTile icon={UserCheck} value={placed} label="Actief geplaatst" />
        <StatTile icon={Briefcase} value={openRequests} label="Open aanvragen" />
        <StatTile icon={Users} value={onboarding} label="In onboarding" />
      </div>

      <SectionTitle title="Recente sollicitaties" href="/client/candidates" />
      {applications.length === 0 ? (
        <WhiteCard className="text-sm text-[#5b6558]">Nog geen profielen met u gedeeld. Zodra HR kandidaten voor uw aanvraag heeft, verschijnen ze hier.</WhiteCard>
      ) : (
        <ul className="space-y-2.5">
          {applications.slice(0, 5).map((app) => (
            <li key={app.id}>
              <Link href={`/client/applications/${app.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm">
                <Avatar name={`${app.candidate.firstName} ${app.candidate.lastName}`} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {app.candidate.firstName} {app.candidate.lastName}
                  </span>
                  <span className="block truncate text-xs text-[#5b6558]">
                    {app.positionApplied} · gedeeld {formatDate(app.share.sharedAt)}
                  </span>
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
