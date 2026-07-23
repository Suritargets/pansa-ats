/**
 * ProgressDashboard.tsx
 * WAT:    Visuele voortgangsweergave voor de kandidaatportal — radiale voortgangsindicator +
 *         horizontale pipeline-stepper. Toont géén ruwe interviewscores (interne HR-data),
 *         alleen procesvoortgang.
 */

import { FileText, Search, ListChecks, MessageSquare, Handshake, ClipboardCheck, PartyPopper, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_FLOW: ApplicationStatus[] = ['new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding', 'active']

const STEP_ICONS: Record<ApplicationStatus, typeof FileText> = {
  new: FileText,
  in_review: Search,
  shortlisted: ListChecks,
  interview: MessageSquare,
  offer: Handshake,
  onboarding: ClipboardCheck,
  active: PartyPopper,
  rejected: XCircle,
  withdrawn: XCircle,
}

export function ProgressDashboard({
  status,
  daysSinceApplied,
  interviewCount,
}: {
  status: ApplicationStatus
  daysSinceApplied: number
  interviewCount: number
}) {
  const isTerminated = status === 'rejected' || status === 'withdrawn'
  const currentIndex = STATUS_FLOW.indexOf(status)
  const progressRatio = isTerminated ? 1 : (currentIndex + 1) / STATUS_FLOW.length
  const progressPercent = Math.round(progressRatio * 100)

  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference * (1 - progressRatio)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-6 sm:flex-row sm:items-center">
          <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0 -rotate-90">
            <circle cx="56" cy="56" r="40" fill="none" stroke="var(--muted)" strokeWidth="10" />
            <circle
              cx="56"
              cy="56"
              r="40"
              fill="none"
              stroke={isTerminated ? 'var(--destructive)' : 'var(--primary)'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-500"
            />
            <text x="56" y="56" textAnchor="middle" dominantBaseline="middle" className="rotate-90 origin-center fill-foreground text-2xl font-heading font-semibold">
              {progressPercent}%
            </text>
          </svg>
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <p className="font-heading text-lg font-semibold text-foreground">{APPLICATION_STATUS_LABELS[status]}</p>
            <p className="text-sm text-muted-foreground">
              {isTerminated
                ? 'Dit traject is afgerond.'
                : `Fase ${currentIndex + 1} van ${STATUS_FLOW.length} in het wervingsproces.`}
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm sm:justify-start">
              <Stat label="Dagen sinds sollicitatie" value={String(daysSinceApplied)} />
              <Stat label="Gesprekken afgerond" value={String(interviewCount)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isTerminated && (
        <Card>
          <CardContent className="py-6">
            <ol className="flex flex-wrap items-start justify-between gap-y-4">
              {STATUS_FLOW.map((step, index) => {
                const Icon = STEP_ICONS[step]
                const done = index < currentIndex
                const current = index === currentIndex
                return (
                  <li key={step} className="flex flex-1 flex-col items-center gap-1.5 px-1 text-center">
                    <div className="relative flex w-full items-center">
                      {index > 0 && (
                        <span className={cn('absolute right-1/2 h-0.5 w-full -translate-y-1/2', done || current ? 'bg-primary' : 'bg-muted')} />
                      )}
                      <span
                        className={cn(
                          'relative z-10 mx-auto flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                          done ? 'border-primary bg-primary text-primary-foreground' : current ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                    </div>
                    <span className={cn('text-xs', done || current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                      {APPLICATION_STATUS_LABELS[step]}
                    </span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-heading text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
