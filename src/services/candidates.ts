'use server'

/**
 * candidates.ts
 * WAT:    Server Actions voor kandidaatgegevens die niet bij de sollicitatie zelf horen —
 *         noodcontacten (van "Basisgegevens nieuwe medewerker") en het bewerken van de
 *         kandidaat zelf vanuit de kandidatenlijst (detail-paneel).
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { logAuditEvent } from '@/lib/audit'
import { emergencyContacts, candidates, type Candidate, type Gender, type MaritalStatus } from '../../drizzle/schema'

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

export interface UpdateCandidateState {
  success: boolean
  error?: string
  candidate?: Candidate
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export async function updateCandidate(
  id: string,
  _prevState: UpdateCandidateState,
  formData: FormData
): Promise<UpdateCandidateState> {
  const session = await requireSession([...STAFF_ROLES])

  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  if (!firstName || !lastName) {
    return { success: false, error: 'Voornaam en achternaam zijn verplicht.' }
  }

  const values = {
    firstName,
    lastName,
    email: String(formData.get('email') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    dateOfBirth: String(formData.get('dateOfBirth') ?? '').trim() || null,
    gender: (String(formData.get('gender') ?? '').trim() || null) as Gender | null,
    maritalStatus: (String(formData.get('maritalStatus') ?? '').trim() || null) as MaritalStatus | null,
    nationality: String(formData.get('nationality') ?? '').trim() || null,
    residence: String(formData.get('residence') ?? '').trim() || null,
    district: String(formData.get('district') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
    hasDriversLicense: formData.get('hasDriversLicense') === 'on',
    driversLicenseCategory: String(formData.get('driversLicenseCategory') ?? '').trim() || null,
    yearsExperience: String(formData.get('yearsExperience') ?? '').trim() || null,
    skills: splitList(formData.get('skills')),
    certifications: splitList(formData.get('certifications')),
    notes: String(formData.get('notes') ?? '').trim() || null,
  }

  const [updated] = await db
    .update(candidates)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(candidates.id, id))
    .returning()

  if (!updated) {
    return { success: false, error: 'Kandidaat niet gevonden.' }
  }

  await logAuditEvent(session, 'candidate_updated', { entityType: 'candidate', entityId: id })
  revalidatePath('/admin/candidates')

  return { success: true, candidate: updated }
}
