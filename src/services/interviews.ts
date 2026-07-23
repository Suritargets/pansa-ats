'use server'

/**
 * interviews.ts
 * WAT:    Server Actions voor interview-scorecards (algemeen/scored, werkervaring/open,
 *         client, medisch, tweede gesprek — zie interviewTypeEnum).
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { interviews, type InterviewType } from '../../drizzle/schema'

export interface InterviewQuestionAnswer {
  category: string
  question?: string
  answer: string
  score?: number
}

export interface InterviewInput {
  type: InterviewType
  conductedAt?: string
  questions?: InterviewQuestionAnswer[]
  notes?: string
}

export async function addInterview(applicationId: string, input: InterviewInput): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])

  const scores = (input.questions ?? []).map((q) => q.score).filter((s): s is number => typeof s === 'number')
  const totalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) : null
  const averageScore = scores.length > 0 ? totalScore! / scores.length : null

  await db.insert(interviews).values({
    applicationId,
    type: input.type,
    conductedBy: session.userId,
    conductedAt: input.conductedAt ? new Date(input.conductedAt) : new Date(),
    questions: input.questions ?? [],
    totalScore: totalScore?.toString() ?? null,
    averageScore: averageScore?.toString() ?? null,
    notes: input.notes || null,
  })

  revalidatePath(`/admin/applications/${applicationId}`)
}
