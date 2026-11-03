/**
 * admin/agreements/[id]/page.tsx
 * WAT:    Eén overeenkomst bekijken en wijzigen: staat, einde van de lopende periode en opzegmoment bovenaan.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getServiceAgreement } from '@/services/queries'
import { deleteAgreement } from '@/services/agreements'
import { AdminShell } from '@/components/admin/AdminShell'
import { AgreementForm } from '@/components/admin/AgreementForm'
import { AgreementStateBadge } from '@/components/admin/AgreementStateBadge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { describeDays } from '@/lib/contract-monitor'
import { agreementState, currentPeriodEnd, daysLeft, noticeDeadline } from '@/lib/service-agreements'

export default async function AgreementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { id } = await params
  const { saved, error } = await searchParams
  const agreement = await getServiceAgreement(id)
  if (!agreement) notFound()

  const periodEnd = currentPeriodEnd(agreement)
  const deadline = noticeDeadline(agreement)

  return (
    <AdminShell session={session}>
      <p className="mb-1 text-sm text-muted-foreground">
        <Link href="/admin/agreements" className="hover:underline">
          Overeenkomsten
        </Link>{' '}
        ·{' '}
        <Link href={`/admin/clients/${agreement.clientId}`} className="hover:underline">
          {agreement.clientName}
        </Link>
      </p>
      <h1 className="mb-3 flex flex-wrap items-center gap-3 text-lg font-semibold text-foreground">
        {agreement.title}
        <AgreementStateBadge state={agreementState(agreement)} />
      </h1>
      <dl className="mb-6 grid max-w-xl grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border p-3">
          <dt className="text-muted-foreground">Einde lopende periode</dt>
          <dd className="font-medium">
            {periodEnd ? `${formatDate(periodEnd)} (${describeDays(daysLeft(periodEnd))})` : 'Doorlopend'}
          </dd>
        </div>
        <div className="rounded-lg border border-border p-3">
          <dt className="text-muted-foreground">Opzeggen of verlengen vóór</dt>
          <dd className="font-medium">{deadline ? formatDate(deadline) : '—'}</dd>
        </div>
      </dl>

      <AgreementForm agreement={agreement} clientId={agreement.clientId} saved={saved === '1'} error={error} />

      <form action={deleteAgreement.bind(null, agreement.id)} className="mt-8 border-t border-border pt-4">
        <Button type="submit" variant="destructive">
          Overeenkomst verwijderen
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">Liever opzeggen? Zet de status op &quot;Opgezegd&quot;; dan blijft hij bewaard.</p>
      </form>
    </AdminShell>
  )
}
