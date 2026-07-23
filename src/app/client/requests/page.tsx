import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { listJobCategories, listOwnVacancyRequestsForClient } from '@/services/queries'
import { ClientShell } from '@/components/client/ClientShell'
import { VacancyRequestForm } from '@/components/client/VacancyRequestForm'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { VacancyRequestStatus } from '@/types/database'

const STATUS_LABELS: Record<VacancyRequestStatus, string> = {
  submitted: 'Verstuurd',
  reviewing: 'In behandeling',
  approved: 'Goedgekeurd',
  fulfilled: 'Vervuld',
  rejected: 'Afgewezen',
}

export default async function ClientRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { saved } = await searchParams
  const [jobCategories, requests] = await Promise.all([
    listJobCategories(),
    listOwnVacancyRequestsForClient(session.clientId),
  ])

  return (
    <ClientShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Vacature aanvragen</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <VacancyRequestForm jobCategories={jobCategories} saved={saved === '1'} />

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Mijn aanvragen
          </h2>
          <ul className="space-y-2">
            {requests.length === 0 && <p className="text-sm text-muted-foreground">Nog geen aanvragen.</p>}
            {requests.map((req) => (
              <li key={req.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{req.jobCategory?.name ?? 'Onbekende functie'} × {req.quantity}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</p>
                </div>
                <Badge variant="outline">{STATUS_LABELS[req.status]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ClientShell>
  )
}
