/**
 * MyOnboardingTrainings.tsx
 * WAT:    Read-only weergave van onboarding-checklist en trainingsvoortgang voor de kandidaat
 *         zelf — geen scores (interne HR-data), alleen status, zelfde terughoudendheid als
 *         ProgressDashboard.tsx.
 */

import { CheckCircle2, Circle, CircleDashed, CircleSlash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OnboardingStepStatus, OnboardingStepTemplate, TrainingProgressStatus, Training } from '@/types/database'

const ONBOARDING_ICON: Record<OnboardingStepStatus, typeof Circle> = {
  pending: Circle,
  in_progress: CircleDashed,
  done: CheckCircle2,
  skipped: CircleSlash,
}

const ONBOARDING_LABELS: Record<OnboardingStepStatus, string> = {
  pending: 'Te doen',
  in_progress: 'Bezig',
  done: 'Gereed',
  skipped: 'Overgeslagen',
}

const TRAINING_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

export function MyOnboardingChecklist({
  steps,
  progress,
}: {
  steps: OnboardingStepTemplate[]
  progress: { stepTemplateId: string; status: OnboardingStepStatus }[]
}) {
  if (steps.length === 0) return null
  const statusByStep = new Map(progress.map((p) => [p.stepTemplateId, p.status]))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Onboarding</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {steps.map((step) => {
            const status = statusByStep.get(step.id) ?? 'pending'
            const Icon = ONBOARDING_ICON[status]
            return (
              <li key={step.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <Icon className={cn('size-4 shrink-0 text-muted-foreground', status === 'done' && 'text-primary')} />
                <span className={cn('flex-1', status === 'done' && 'text-muted-foreground')}>{step.title}</span>
                <span className="text-xs text-muted-foreground">{ONBOARDING_LABELS[status]}</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

export function MyTrainingProgress({
  progress,
}: {
  progress: { status: TrainingProgressStatus; training: Training }[]
}) {
  if (progress.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Trainingen</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {progress.map((p) => (
            <li key={p.training.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <div>
                <p className="text-foreground">{p.training.title}</p>
                {p.training.standard && <p className="text-xs text-muted-foreground">{p.training.standard}</p>}
              </div>
              <Badge variant="outline">{TRAINING_LABELS[p.status]}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
