'use server'

/**
 * trainings.ts
 * WAT:    Server Actions voor trainingen (ASME/AWS/API e.d.) en voortgang per kandidaat.
 */

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { candidateTrainingProgress, trainings, type TrainingProgressStatus } from '../../drizzle/schema'

export async function createTraining(formData: FormData): Promise<void> {
  await requireSession([...STAFF_ROLES])

  const durationHours = String(formData.get('durationHours') ?? '').trim()

  await db.insert(trainings).values({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    standard: String(formData.get('standard') ?? '').trim() || null,
    durationHours: durationHours || null,
  })

  revalidatePath('/admin/trainings')
}

export async function setCandidateTrainingProgress(
  applicationId: string,
  trainingId: string,
  status: TrainingProgressStatus,
  score?: number
): Promise<void> {
  await requireSession([...STAFF_ROLES])

  await db
    .insert(candidateTrainingProgress)
    .values({
      applicationId,
      trainingId,
      status,
      score: score?.toString() ?? null,
      startedAt: status === 'in_progress' ? new Date() : null,
      completedAt: status === 'completed' ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [candidateTrainingProgress.applicationId, candidateTrainingProgress.trainingId],
      // `score` is omitted when not passed so cycling the status doesn't wipe a score set earlier.
      set: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
        ...(score !== undefined ? { score: score.toString() } : {}),
      },
    })

  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/trainings')
}

export async function removeCandidateTraining(applicationId: string, trainingId: string): Promise<void> {
  await requireSession([...STAFF_ROLES])

  await db
    .delete(candidateTrainingProgress)
    .where(
      and(eq(candidateTrainingProgress.applicationId, applicationId), eq(candidateTrainingProgress.trainingId, trainingId))
    )

  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/trainings')
}
