/**
 * admin/validity/page.tsx
 * WAT:    Geldigheid: alles wat afloopt of verlopen is op één lijst — klantovereenkomsten, arbeidscontracten
 *         en RGM-badges — met een vooruitkijkperiode van 30, 60 of 90 dagen.
 * WAAROM: HR moet nu drie schermen afgaan; dit geeft één werklijst, gesorteerd op wat het eerst afloopt.
 */

import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listContractsForMonitoring, listServiceAgreements } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { describeDays } from '@/lib/contract-monitor'
import { currentPeriodEnd, daysLeft } from '@/lib/service-agreements'

const WINDOWS = [30, 60, 90] as const

interface Item {
  key: string
  kind: 'Overeenkomst' | 'Contract' | 'RGM-badge'
  what: string
  who: string
  date: string
  days: number
  href: string
}

export default async function ValidityPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { days } = await searchParams
  const window = WINDOWS.find((w) => String(w) === days) ?? 60
  const [agreements, contracts] = await Promise.all([listServiceAgreements(), listContractsForMonitoring()])

  const items: Item[] = []
  for (const a of agreements) {
    if (a.status !== 'active') continue
    const end = currentPeriodEnd(a)
    const left = daysLeft(end)
    // Opzegmoment telt mee: een overeenkomst met 60 dagen opzegtermijn vraagt eerder aandacht.
    if (end && left !== null && left - a.noticeDays <= window) {
      items.push({ key: `a-${a.id}`, kind: 'Overeenkomst', what: a.title, who: a.clientName, date: end, days: left, href: `/admin/agreements/${a.id}` })
    }
  }
  for (const { contract, application } of contracts) {
    if (contract.status !== 'active') continue
    const name = `${application.candidate.firstName} ${application.candidate.lastName}`
    const href = `/admin/applications/${application.id}/contract`
    const endLeft = daysLeft(contract.endDate)
    if (contract.endDate && endLeft !== null && endLeft <= window) {
      items.push({ key: `c-${contract.id}`, kind: 'Contract', what: application.positionApplied, who: name, date: contract.endDate, days: endLeft, href })
    }
    const badgeLeft = daysLeft(contract.badgeExpiryDate)
    if (contract.badgeExpiryDate && badgeLeft !== null && badgeLeft <= window) {
      items.push({ key: `b-${contract.id}`, kind: 'RGM-badge', what: contract.badgeNumber ?? 'Badge', who: name, date: contract.badgeExpiryDate, days: badgeLeft, href })
    }
  }
  items.sort((a, b) => a.days - b.days)
  const expired = items.filter((i) => i.days < 0).length

  return (
    <AdminShell session={session}>
      <PageHeader title="Geldigheid" subtitle={`Wat binnen ${window} dagen afloopt of al verlopen is${expired ? ` — ${expired} verlopen` : ''}`} count={items.length}>
        <nav className="flex gap-1 text-sm">
          {WINDOWS.map((w) => (
            <Link
              key={w}
              href={`/admin/validity?days=${w}`}
              className={`rounded-full border px-3 py-1 ${w === window ? 'border-primary bg-primary/10 font-medium' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {w} dagen
            </Link>
          ))}
        </nav>
      </PageHeader>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Niets dat binnen {window} dagen afloopt.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Soort</TableHead>
                <TableHead>Wat</TableHead>
                <TableHead>Wie</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Wanneer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.key}>
                  <TableCell>
                    <Badge variant="outline">{i.kind}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={i.href} className="font-medium text-foreground hover:underline">
                      {i.what}
                    </Link>
                  </TableCell>
                  <TableCell>{i.who}</TableCell>
                  <TableCell>{formatDate(i.date)}</TableCell>
                  <TableCell className={i.days < 0 ? 'font-medium text-destructive' : i.days <= 30 ? 'text-amber-600' : ''}>{describeDays(i.days)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  )
}
