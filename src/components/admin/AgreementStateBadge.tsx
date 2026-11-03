/**
 * AgreementStateBadge.tsx
 * WAT:    Statuslabel van een overeenkomst (loopt, opzegperiode, verlopen...) in de huisstijlkleuren.
 */

import { Badge } from '@/components/ui/badge'
import { STATE_LABELS, type AgreementState } from '@/lib/service-agreements'

const VARIANT: Record<AgreementState, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  cancelled: 'outline',
  open_ended: 'secondary',
  running: 'default',
  notice: 'secondary',
  expired: 'destructive',
}

export function AgreementStateBadge({ state }: { state: AgreementState }) {
  return (
    <Badge variant={VARIANT[state]} className={state === 'notice' ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' : undefined}>
      {STATE_LABELS[state]}
    </Badge>
  )
}
