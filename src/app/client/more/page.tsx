/**
 * client/more/page.tsx
 * WAT:    "Meer" = Bedrijfsprofiel & beheer (mobiel ontwerp 10): bedrijfskop, vier tellers (actieve
 *         vacatures, totaal gedeelde profielen, geplaatst, in onboarding), recente vacatures,
 *         contactgegevens van Pansa HR en uitloggen.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, ChevronRight, LogOut, Mail, Phone } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getClientById, listOwnVacancyRequestsForClient, listSharedApplicationsForClient } from '@/services/queries'
import { logoutAction } from '@/services/auth-actions'
import { PortalShell, SectionTitle, WhiteCard } from '@/components/portal/PortalShell'
import { formatDate } from '@/lib/utils'
import type { VacancyRequestStatus } from '@/types/database'

const STATUS_LABELS: Record<VacancyRequestStatus, string> = {
  submitted: 'Verstuurd',
  reviewing: 'In behandeling',
  approved: 'Goedgekeurd',
  fulfilled: 'Vervuld',
  rejected: 'Afgewezen',
}

export default async function ClientMorePage() {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const [client, applications, requests] = await Promise.all([
    getClientById(session.clientId),
    listSharedApplicationsForClient(session.clientId),
    listOwnVacancyRequestsForClient(session.clientId),
  ])
  if (!client) redirect('/client')

  const open = requests.filter((r) => ['submitted', 'reviewing', 'approved'].includes(r.status)).length
  const stats = [
    { value: open, label: 'Actieve aanvragen' },
    { value: applications.length, label: 'Gedeelde profielen' },
    { value: applications.filter((a) => a.status === 'active').length, label: 'Geplaatst' },
    { value: applications.filter((a) => a.status === 'onboarding').length, label: 'In onboarding' },
  ]

  return (
    <PortalShell variant="client" session={session} title="Bedrijfsprofiel" back="/client/dashboard">
      <WhiteCard className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-deep)] text-white">
          <Building2 className="size-8" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-bold">{client.name}</span>
          <span className="block text-sm text-[#5b6558]">{client.industry || 'Sector niet ingevuld'}</span>
          {client.address && <span className="block text-xs text-[#8a9486]">{client.address}</span>}
        </span>
      </WhiteCard>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <WhiteCard key={s.label} className="p-2.5 text-center">
            <span className="block font-heading text-2xl leading-none font-semibold tabular-nums">{s.value}</span>
            <span className="mt-1 block text-[10px] leading-tight text-[#5b6558]">{s.label}</span>
          </WhiteCard>
        ))}
      </div>

      <SectionTitle title="Recente vacatures" href="/client/requests" />
      {requests.length === 0 ? (
        <WhiteCard className="text-sm text-[#5b6558]">Nog geen aanvragen. Plaats uw eerste aanvraag onder Vacatures.</WhiteCard>
      ) : (
        <ul className="space-y-2">
          {requests.slice(0, 3).map((r) => (
            <li key={r.id}>
              <Link href="/client/requests" className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {r.jobCategory?.name ?? 'Onbekende functie'} × {r.quantity}
                  </span>
                  <span className="block text-xs text-[#5b6558]">
                    {formatDate(r.createdAt)}
                    {r.referenceNumber ? ` · ${r.referenceNumber}` : ''}
                  </span>
                </span>
                <span className="rounded-full bg-[#1c9848]/12 px-2.5 py-0.5 text-xs font-semibold text-[#146d34]">{STATUS_LABELS[r.status]}</span>
                <ChevronRight className="size-4 text-[#8a9486]" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle title="Contact Pansa HR" />
      <WhiteCard className="space-y-2.5 text-sm">
        <a href="mailto:humanresource@hpsnv.com" className="flex items-center gap-3">
          <Mail className="size-4 text-[#1c9848]" />
          humanresource@hpsnv.com
        </a>
        <a href="tel:+597323451" className="flex items-center gap-3">
          <Phone className="size-4 text-[#1c9848]" />
          +597 323451
        </a>
      </WhiteCard>

      <form action={logoutAction.bind(null, '/client')} className="mt-8">
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10">
          <LogOut className="size-4" />
          Uitloggen
        </button>
      </form>
    </PortalShell>
  )
}
