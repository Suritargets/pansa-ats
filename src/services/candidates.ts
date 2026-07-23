'use server'

/**
 * candidates.ts
 * WAT:    Server Actions voor kandidaatgegevens die niet bij de sollicitatie zelf horen —
 *         hier: noodcontacten (van "Basisgegevens nieuwe medewerker").
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { emergencyContacts } from '../../drizzle/schema'

export interface EmergencyContactInput {
  name: string
  relationship?: string
  phone?: string
  address?: string
  priority?: number
}

export async function addEmergencyContact(
  candidateId: string,
  applicationId: string,
  input: EmergencyContactInput
): Promise<void> {
  await requireSession([...STAFF_ROLES])

  await db.insert(emergencyContacts).values({
    candidateId,
    name: input.name,
    relationship: input.relationship || null,
    phone: input.phone || null,
    address: input.address || null,
    priority: input.priority ?? 1,
  })

  revalidatePath(`/admin/applications/${applicationId}`)
}

export async function removeEmergencyContact(id: string, applicationId: string): Promise<void> {
  await requireSession([...STAFF_ROLES])
  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id))
  revalidatePath(`/admin/applications/${applicationId}`)
}
