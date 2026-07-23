'use server'

/**
 * candidate-portal.ts
 * WAT:    Server Actions voor de candidate-portal — een kandidaat mag alleen zijn eigen
 *         gegevens lezen/wijzigen, altijd gescoped op `session.candidateId`.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { candidates } from '../../drizzle/schema'

export async function updateOwnContactInfo(formData: FormData): Promise<void> {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  await db
    .update(candidates)
    .set({
      phone: String(formData.get('phone') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      address: String(formData.get('address') ?? '').trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(candidates.id, session.candidateId))

  revalidatePath('/candidate/profile')
  redirect('/candidate/profile?saved=1')
}
