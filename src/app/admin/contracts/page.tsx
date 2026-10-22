/**
 * admin/contracts/page.tsx
 * WAT:    Overzicht van lopende arbeidsovereenkomsten: einddatum, RGM-badge-vervaldatum en de
 *         proeftijdevaluaties (week 4 / week 8) — met waarschuwingen.
 * WAAROM: Het Werving-, selectie- en introductieproces (PGC-HR-PR-0501-05) noemt "Contractperiode
 *         monitoren", een maandelijks AO-overzicht en een RGM-badge-overzicht inclusief vervaldatum.
 *         Dit was alleen handmatig (Excel) te volgen.
 */

import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listContractsForMonitoring } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import {
  EXPIRY_WARNING_DAYS,
  PROBATION_LOOKAHEAD_DAYS,
  daysUntil,
  describeDays,
  expiryLevel,
  needsAttention,
  probationAttention,
  type ExpiryLevel,
} from '@/lib/contract-monitor'
import type { ContractStage } from '@/types/database'

const STAGE_LABELS: Record<ContractStage, string> = {
  probation_2m: 'Proeftijd (2 mnd)',
  term_4m: 'Termijn (4 mnd)',
  extension_6m: 'Verlenging (6 mnd)',
  extension_12m: 'Verlenging (12 mnd)',
  permanent: 'Vast',
}

const LEVEL_VARIANT: Record<ExpiryLevel, 'destructive' | 'secondary' | 'outline'> = {
  expired: 'destructive',
  soon: 'secondary',
  ok: 'outline',
  unknown: 'outline',
}

export default async function ContractsMonitorPage() {
  const session = await requireSession([...STAFF_ROLES])
  const rows = await listContractsForMonitoring()

  // Contracten zonder einddatum (bv. vast) onderaan; verder oplopend op einddatum.
  const sorted = [...rows].sort((a, b) => {
    const da = daysUntil(a.contract.endDate)
    const db = daysUntil(b.contract.endDate)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })

  const active = sorted.filter((r) => r.contract.status === 'active')
  const ending = active.filter((r) => needsAttention(r.contract.endDate)).length
  const badges = active.filter((r) => needsAttention(r.contract.badgeExpiryDate)).length
  const probation = active.filter((r) => probationAttention(r.contract).length > 0).length

  return (
    <AdminShell session={session}>
      <PageHeader
        title="Contracten & badges"
        count={sorted.length}
        subtitle={`Lopende arbeidsovereenkomsten — waarschuwing bij einddatum of badge-vervaldatum binnen ${EXPIRY_WARNING_DAYS} dagen; proeftijdevaluatie binnen ${PROBATION_LOOKAHEAD_DAYS} dagen of te laat.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Summary label="Contract loopt af / verlopen" value={ending} />
        <Summary label="RGM-badge vervalt / verlopen" value={badges} />
        <Summary label="Proeftijdevaluatie aan de beurt" value={probation} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medewerker</TableHead>
              <TableHead>Functie / client</TableHead>
              <TableHead>Stadium</TableHead>
              <TableHead>Einde contract</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Proeftijd</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  Geen lopende contracten. Leg een contractstadium vast op het tabblad Contract van een sollicitatie.
                </TableCell>
              </TableRow>
            )}
            {sorted.map(({ contract, application, clientName }) => {
              const endDays = daysUntil(contract.endDate)
              const badgeDays = daysUntil(contract.badgeExpiryDate)
              const attention = probationAttention(contract)
              return (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link
                      href={`/admin/applications/${application.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {application.candidate.lastName}, {application.candidate.firstName}
                    </Link>
                    {contract.status === 'draft' && <span className="ml-1.5 text-xs text-muted-foreground">(concept)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <p>{application.positionApplied}</p>
                    <p className="text-xs">{clientName ?? application.company.name}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{STAGE_LABELS[contract.stage]}</TableCell>
                  <TableCell>
                    <p className="text-foreground">{formatDate(contract.endDate)}</p>
                    {endDays !== null && (
                      <Badge variant={LEVEL_VARIANT[expiryLevel(endDays)]}>{describeDays(endDays)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-foreground">{contract.badgeNumber || '—'}</p>
                    {contract.badgeExpiryDate && (
                      <p className="text-xs text-muted-foreground">vervalt {formatDate(contract.badgeExpiryDate)}</p>
                    )}
                    {badgeDays !== null && expiryLevel(badgeDays) !== 'ok' && (
                      <Badge variant={LEVEL_VARIANT[expiryLevel(badgeDays)]}>{describeDays(badgeDays)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {attention.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {attention.map((d) => (
                          <Badge key={d.week} variant={d.daysLeft < 0 ? 'destructive' : 'secondary'}>
                            Week {d.week}: {describeDays(d.daysLeft)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-heading font-semibold ${value > 0 ? 'text-destructive' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
