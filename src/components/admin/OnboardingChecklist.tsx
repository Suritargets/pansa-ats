'use client'

/**
 * OnboardingChecklist.tsx
 * WAT:    Checklist van onboarding-stappen (globale templates) met status per application.
 */

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, CircleDashed, CircleSlash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setOnboardingStepStatus } from '@/services/onboarding'
import type { OnboardingStepStatus, OnboardingStepTemplate } from '@/types/database'

const STATUS_ICON: Record<OnboardingStepStatus, typeof Circle> = {
  pending: Circle,
  in_progress: CircleDashed,
  done: CheckCircle2,
  skipped: CircleSlash,
}

const STATUS_LABELS: Record<OnboardingStepStatus, string> = {
  pending: 'Te doen',
  in_progress: 'Bezig',
  done: 'Gereed',
  skipped: 'Overgeslagen',
}

export interface OnboardingProgressRow {
  stepTemplateId: string
  status: OnboardingStepStatus
}

export function OnboardingChecklist({
  applicationId,
  steps,
  progress,
}: {
  applicationId: string
  steps: OnboardingStepTemplate[]
  progress: OnboardingProgressRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const statusByStep = new Map(progress.map((p) => [p.stepTemplateId, p.status]))

  function cycle(stepId: string, current: OnboardingStepStatus) {
    const order: OnboardingStepStatus[] = ['pending', 'in_progress', 'done', 'skipped']
    const next = order[(order.indexOf(current) + 1) % order.length]
    startTransition(async () => {
      await setOnboardingStepStatus(applicationId, stepId, next)
      router.refresh()
    })
  }

  return (
    <ul className="space-y-2">
      {steps.map((step) => {
        const status = statusByStep.get(step.id) ?? 'pending'
        const Icon = STATUS_ICON[status]
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => cycle(step.id, status)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/50',
                status === 'done' && 'text-muted-foreground'
              )}
            >
              <Icon className={cn('size-4 shrink-0', status === 'done' && 'text-primary')} />
              <span className="flex-1">{step.title}</span>
              <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
