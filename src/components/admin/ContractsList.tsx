import Link from 'next/link'
import { Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContractControls } from '@/components/admin/ContractControls'
import { formatDate } from '@/lib/utils'
import { describeDays, daysUntil, expiryLevel } from '@/lib/contract-monitor'
import type { ContractStage, ContractStatus, EmploymentContract } from '@/types/database'

const STAGE_LABELS: Record<ContractStage, string> = {
  probation_2m: 'Proeftijd (2 maanden)',
  term_4m: 'Termijn (4 maanden)',
  extension_6m: 'Verlenging (6 maanden)',
  extension_12m: 'Verlenging (12 maanden)',
  permanent: 'Vast',
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  ended: 'Beëindigd',
  terminated: 'Ontbonden',
}

const STATUS_VARIANT: Record<ContractStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  ended: 'secondary',
  terminated: 'destructive',
}

export function ContractsList({ contracts, applicationId }: { contracts: EmploymentContract[]; applicationId: string }) {
  if (contracts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen arbeidsovereenkomst-stadia vastgelegd.</p>
  }

  return (
    <div className="space-y-3">
      {contracts.map((contract) => {
        const endDays = daysUntil(contract.endDate)
        const badgeDays = daysUntil(contract.badgeExpiryDate)
        const isRunning = contract.status === 'active' || contract.status === 'draft'
        return (
          <Card key={contract.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">{STAGE_LABELS[contract.stage]}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/admin/applications/${applicationId}/contract?contractId=${contract.id}`}
                        target="_blank"
                      />
                    }
                  >
                    <Printer className="size-3" />
                    AO afdrukken
                  </Button>
                  <Badge variant={STATUS_VARIANT[contract.status]}>{STATUS_LABELS[contract.status]}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Start: {formatDate(contract.startDate)}</p>
                <p>
                  Einde: {formatDate(contract.endDate)}
                  {isRunning && endDays !== null && expiryLevel(endDays) !== 'ok' && (
                    <span className="ml-1.5 font-medium text-destructive">({describeDays(endDays)})</span>
                  )}
                </p>
                {contract.hourlyWage && <p>Uurloon: USD {contract.hourlyWage}</p>}
                {contract.department && <p>Afdeling: {contract.department}</p>}
                {contract.jobLevel && <p>Level: {contract.jobLevel}</p>}
                {contract.projectLocation && <p>Project/locatie: {contract.projectLocation}</p>}
                {contract.badgeNumber && <p>Badge: {contract.badgeNumber}</p>}
                {contract.badgeExpiryDate && (
                  <p>
                    Badge vervalt: {formatDate(contract.badgeExpiryDate)}
                    {isRunning && badgeDays !== null && expiryLevel(badgeDays) !== 'ok' && (
                      <span className="ml-1.5 font-medium text-destructive">({describeDays(badgeDays)})</span>
                    )}
                  </p>
                )}
              </dl>
              <ContractControls contract={contract} applicationId={applicationId} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
