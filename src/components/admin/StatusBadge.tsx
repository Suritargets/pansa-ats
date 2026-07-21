import { Badge } from '@/components/ui/badge'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'

const STATUS_VARIANT: Record<ApplicationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'secondary',
  in_review: 'outline',
  shortlisted: 'outline',
  interview: 'outline',
  offer: 'default',
  onboarding: 'default',
  active: 'default',
  rejected: 'destructive',
  withdrawn: 'destructive',
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{APPLICATION_STATUS_LABELS[status]}</Badge>
}
