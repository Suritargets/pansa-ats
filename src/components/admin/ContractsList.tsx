import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { ContractStage, ContractStatus, EmploymentContract } from '@/types/database'

const STAGE_LABELS: Record<ContractStage, string> = {
  probation_2m: 'Proeftijd (2 maanden)',
  term_4m: 'Termijn (4 maanden)',
  extension_6m: 'Verlenging (6 maanden)',
  extension_12m: 'Verlenging (12 maanden)',
  permanent: 'Vast',
}

const STATUS_VARIANT: Record<ContractStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  ended: 'secondary',
  terminated: 'destructive',
}

export function ContractsList({ contracts }: { contracts: EmploymentContract[] }) {
  if (contracts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen arbeidsovereenkomst-stadia vastgelegd.</p>
  }

  return (
    <div className="space-y-3">
      {contracts.map((contract) => (
        <Card key={contract.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{STAGE_LABELS[contract.stage]}</CardTitle>
              <Badge variant={STATUS_VARIANT[contract.status]}>{contract.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Start: {formatDate(contract.startDate)}</p>
            {contract.hourlyWage && <p>Uurloon: {contract.hourlyWage}</p>}
            {contract.badgeNumber && <p>Badge: {contract.badgeNumber}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
