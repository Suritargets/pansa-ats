'use server'

/**
 * job-categories.ts
 * WAT:    Server Actions voor functiecategorieën — alleen super_admin (referentiedata die
 *         de rest van het systeem gebruikt, bv. voor filters en het sollicitatieformulier).
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { jobCategories, type JobBranche, type JobLevel } from '../../drizzle/schema'

function readFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    branche: String(formData.get('branche') ?? 'mining_operations') as JobBranche,
    level: String(formData.get('level') ?? 'operator') as JobLevel,
    active: formData.get('active') === 'on',
  }
}

export async function createJobCategory(formData: FormData): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.insert(jobCategories).values(readFields(formData))
  revalidatePath('/admin/settings/job-categories')
}

export async function updateJobCategory(id: string, formData: FormData): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(jobCategories).set(readFields(formData)).where(eq(jobCategories.id, id))
  revalidatePath('/admin/settings/job-categories')
}

export async function toggleJobCategoryActive(id: string, active: boolean): Promise<void> {
  await requireSession([...SUPER_ADMIN_ROLES])
  await db.update(jobCategories).set({ active }).where(eq(jobCategories.id, id))
  revalidatePath('/admin/settings/job-categories')
}
