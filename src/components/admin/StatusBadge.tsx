/**
 * StatusBadge.tsx
 * WAT:    Statuspil voor een sollicitatie, in de kleuren van het Pansa-dashboardontwerp (zelfde
 *         kleuren als de donut en de pipeline-tegels).
 */

import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  new: 'bg-[#1c9848]/12 text-[#146d34]',
  in_review: 'bg-[#f8cc39]/25 text-[#7a5d00]',
  shortlisted: 'bg-[#1976d2]/12 text-[#0d4f8f]',
  interview: 'bg-[#7e57c2]/14 text-[#4f2f8f]',
  offer: 'bg-[#0d4726]/12 text-[#0d4726]',
  onboarding: 'bg-[#5e35b1]/14 text-[#3f1f8a]',
  active: 'bg-[#1c9848] text-white',
  rejected: 'bg-[#e53935]/12 text-[#9c1f1c]',
  withdrawn: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap', STATUS_CLASSES[status], className)}>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  )
}
