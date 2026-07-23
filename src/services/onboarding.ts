'use server'

/**
 * onboarding.ts
 * WAT:    Server Action om de status van een onboarding-stap (per application) te zetten —
 *         upsert op de unique(applicationId, stepTemplateId).
 */

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { onboardingProgress, type OnboardingStepStatus } from '../../drizzle/schema'

export async function setOnboardingStepStatus(
  applicationId: string,
  stepTemplateId: string,
  status: OnboardingStepStatus,
  notes?: string
): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])

  await db
    .insert(onboardingProgress)
    .values({
      applicationId,
      stepTemplateId,
      status,
      notes: notes || null,
      completedAt: status === 'done' ? new Date() : null,
      completedBy: status === 'done' ? session.userId : null,
    })
    .onConflictDoUpdate({
      target: [onboardingProgress.applicationId, onboardingProgress.stepTemplateId],
      set: {
        status,
        notes: notes || null,
        completedAt: status === 'done' ? new Date() : null,
        completedBy: status === 'done' ? session.userId : null,
      },
    })

  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/onboarding')
}

export async function clearOnboardingStep(applicationId: string, stepTemplateId: string): Promise<void> {
  await requireSession([...STAFF_ROLES])
  await db
    .delete(onboardingProgress)
    .where(
      and(eq(onboardingProgress.applicationId, applicationId), eq(onboardingProgress.stepTemplateId, stepTemplateId))
    )
  revalidatePath(`/admin/applications/${applicationId}`)
}
