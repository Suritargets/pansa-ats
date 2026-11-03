/**
 * admin/agreements/page.tsx
 * WAT:    Overzicht van dienstverlenings-overeenkomsten met klanten: soort, looptijd, opzegmoment en staat,
 *         met filter op staat (bv. alleen "opzegperiode" of "verlopen").
 */

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listClients, listServiceAgreements } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { AgreementStateBadge } from '@/components/admin/AgreementStateBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { AGREEMENT_KIND_LABELS, STATE_LABELS, agreementState, currentPeriodEnd, daysLeft, noticeDeadline, type AgreementState } from '@/lib/service-agreements'
import { describeDays } from '@/lib/contract-monitor'

const FILTERS: (AgreementState | 'all')[] = ['all', 'notice', 'expired', 'running', 'open_ended', 'draft', 'cancelled']

export default async function AgreementsPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { state } = await searchParams
  const [agreements, clients] = await Promise.all([listServiceAgreements(), listClients()])

  const rows = agreements.map((a) => ({ ...a, state: agreementState(a), periodEnd: currentPeriodEnd(a), deadline: noticeDeadline(a) }))
  const filter = FILTERS.includes(state as AgreementState) ? (state as AgreementState) : 'all'
  const shown = filter === 'all' ? rows : rows.filter((r) => r.state === filter)
  // Wat het eerst aandacht vraagt bovenaan: verlopen, dan opzegperiode, dan de rest op einddatum.
  const rank: Record<AgreementState, number> = { expired: 0, notice: 1, running: 2, open_ended: 3, draft: 4, cancelled: 5 }
  shown.sort((a, b) => rank[a.state] - rank[b.state] || (a.periodEnd ?? '9999').localeCompare(b.periodEnd ?? '9999'))

  return (
    <AdminShell session={session}>
      <PageHeader title="Overeenkomsten" subtitle="Dienstverlening met klanten: looptijd, opzegtermijn en verlenging" count={shown.length}>
        {clients.length > 0 && (
          <Link
            href={`/admin/agreements/new?clientId=${clients[0].id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Nieuwe overeenkomst
          </Link>
        )}
      </PageHeader>

      <nav className="mb-4 flex flex-wrap gap-1 text-sm">
        {FILTERS.map((f) => {
          const n = f === 'all' ? rows.length : rows.filter((r) => r.state === f).length
          return (
            <Link
              key={f}
              href={f === 'all' ? '/admin/agreements' : `/admin/agreements?state=${f}`}
              className={`rounded-full border px-3 py-1 ${filter === f ? 'border-primary bg-primary/10 font-medium' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'all' ? 'Alle' : STATE_LABELS[f]} ({n})
            </Link>
          )
        })}
      </nav>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {clients.length === 0 ? 'Maak eerst een klant aan; een overeenkomst hoort altijd bij een klant.' : 'Geen overeenkomsten in deze selectie.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Overeenkomst</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Soort</TableHead>
                <TableHead>Einde periode</TableHead>
                <TableHead>Opzeggen vóór</TableHead>
                <TableHead>Staat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/admin/agreements/${a.id}`} className="font-medium text-foreground hover:underline">
                      {a.title}
                    </Link>
                    {a.autoRenew && <span className="ml-2 text-xs text-muted-foreground">verlengt automatisch</span>}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/clients/${a.clientId}`} className="hover:underline">
                      {a.clientName}
                    </Link>
                  </TableCell>
                  <TableCell>{AGREEMENT_KIND_LABELS[a.kind]}</TableCell>
                  <TableCell>
                    {a.periodEnd ? (
                      <>
                        {formatDate(a.periodEnd)}
                        <span className="block text-xs text-muted-foreground">{describeDays(daysLeft(a.periodEnd))}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{a.deadline ? formatDate(a.deadline) : '—'}</TableCell>
                  <TableCell>
                    <AgreementStateBadge state={a.state} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  )
}
