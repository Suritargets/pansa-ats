/**
 * client/requests/page.tsx
 * WAT:    Vacatures van de client: eigen aanvragen met status + inklapbaar formulier "Nieuwe aanvraag"
 *         (functie, aantal, Req#/RFP-ID#, functie-eisen).
 */

import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { listInterviewQuestions, listJobCategories, listOwnVacancyRequestsForClient } from '@/services/queries'
import { PortalShell, WhiteCard } from '@/components/portal/PortalShell'
import { VacancyRequestForm } from '@/components/client/VacancyRequestForm'
import { formatDate } from '@/lib/utils'
import type { VacancyRequestStatus } from '@/types/database'

const STATUS_LABELS: Record<VacancyRequestStatus, string> = {
  submitted: 'Verstuurd',
  reviewing: 'In behandeling',
  approved: 'Goedgekeurd',
  fulfilled: 'Vervuld',
  rejected: 'Afgewezen',
}

const STATUS_CLASSES: Record<VacancyRequestStatus, string> = {
  submitted: 'bg-[#f8cc39]/25 text-[#7a5d00]',
  reviewing: 'bg-[#1976d2]/12 text-[#0d4f8f]',
  approved: 'bg-[#1c9848]/12 text-[#146d34]',
  fulfilled: 'bg-[#1c9848] text-white',
  rejected: 'bg-[#e53935]/12 text-[#9c1f1c]',
}

export default async function ClientRequestsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { saved } = await searchParams
  const [jobCategories, requests, workExperienceQuestions] = await Promise.all([
    listJobCategories(),
    listOwnVacancyRequestsForClient(session.clientId),
    listInterviewQuestions('work_experience'),
  ])
  const scopeCategories = [...new Set(workExperienceQuestions.map((q) => q.category ?? q.text))]

  return (
    <PortalShell variant="client" session={session} wide title="Vacatures" back="/client/dashboard">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <details className="group rounded-2xl bg-white/10 open:bg-transparent" open={saved === '1' ? false : undefined}>
            <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-yellow)] px-5 py-4 text-base font-bold text-[#0b100c] marker:content-none">
              <Plus className="size-5" />
              Nieuwe aanvraag
            </summary>
            <div className="mt-3 rounded-2xl bg-white p-4 text-[#10150f]">
              <VacancyRequestForm jobCategories={jobCategories} scopeCategories={scopeCategories} saved={false} />
            </div>
          </details>
          {saved === '1' && (
            <p className="mt-3 rounded-xl bg-[var(--color-brand-green)]/25 px-4 py-3 text-sm font-semibold text-[var(--color-brand-lime)]">
              Aanvraag verstuurd — Pansa HR neemt hem in behandeling.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-sans text-lg font-bold">Mijn aanvragen ({requests.length})</h2>
          {requests.length === 0 ? (
            <WhiteCard className="text-sm text-[#5b6558]">Nog geen aanvragen.</WhiteCard>
          ) : (
            <ul className="space-y-2.5">
              {requests.map((req) => (
                <li key={req.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {req.jobCategory?.name ?? 'Onbekende functie'} × {req.quantity}
                    </span>
                    <span className="block text-xs text-[#5b6558]">
                      {formatDate(req.createdAt)}
                      {req.referenceNumber ? ` · ${req.referenceNumber}` : ''}
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[req.status]}`}>{STATUS_LABELS[req.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
