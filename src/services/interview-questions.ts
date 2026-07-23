'use server'

/**
 * interview-questions.ts
 * WAT:    Server Actions voor de beheerbare interviewvragen-bank — alleen super_admin.
 * WAAROM: Deze vragen sturen vandaag InterviewForm.tsx aan; later ook de geplande
 *         sollicitatie-chatwidget op de publieke website (zie DEVLOG).
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { interviewQuestions, type InterviewType } from '../../drizzle/schema'

function readFields(formData: FormData) {
  return {
    type: (String(formData.get('type') ?? 'general') as InterviewType) || 'general',
    category: String(formData.get('category') ?? '').trim() || null,
    text: String(formData.get('text') ?? '').trim(),
    scored: formData.get('scored') === 'on',
    stepOrder: Number(formData.get('stepOrder') ?? 0) || 0,
  }
}

export async function createInterviewQuestion(formData: FormData): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.insert(interviewQuestions).values(readFields(formData))
  revalidatePath('/admin/settings/interview-questions')
}

export async function updateInterviewQuestion(id: string, formData: FormData): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(interviewQuestions).set(readFields(formData)).where(eq(interviewQuestions.id, id))
  revalidatePath('/admin/settings/interview-questions')
}

export async function toggleInterviewQuestionActive(id: string, active: boolean): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(interviewQuestions).set({ active }).where(eq(interviewQuestions.id, id))
  revalidatePath('/admin/settings/interview-questions')
}
