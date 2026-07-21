'use server'

/**
 * applications.ts
 * WAT:    Server Actions rond sollicitaties: aanmaken (online + digitalisering),
 *         document-upload, status wijzigen.
 * WAAROM: Draait server-side (Drizzle + Vercel Blob), aanroepbaar vanuit client components
 *         zonder een aparte API-route.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { uploadDocument } from '@/lib/blob'
import {
  applicationDocuments,
  applications,
  applicationStatusHistory,
  candidates,
  type ApplicationSource,
  type ApplicationStatus,
  type DocumentKind,
} from '../../drizzle/schema'

export interface NewApplicationInput {
  companyId: string
  positionApplied: string
  source: ApplicationSource
  coverNote?: string
  candidate: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    dateOfBirth?: string
    address?: string
    idNumber?: string
    nationality?: string
    yearsExperience?: number
    skills?: string[]
  }
}

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string }

/**
 * Maakt een candidate + application aan. Publiek toegankelijk (sollicitatieformulier) en
 * gebruikt door het digitaliseer-scherm (staff, sessie vereist).
 */
export async function submitApplication(
  input: NewApplicationInput,
  requireStaff = false
): Promise<ServiceResult<{ applicationId: string; candidateId: string }>> {
  try {
    if (requireStaff) await requireSession(['super_admin', 'hr_staff', 'recruiter'])

    const [candidate] = await db
      .insert(candidates)
      .values({
        firstName: input.candidate.firstName,
        lastName: input.candidate.lastName,
        email: input.candidate.email ?? null,
        phone: input.candidate.phone ?? null,
        dateOfBirth: input.candidate.dateOfBirth ?? null,
        address: input.candidate.address ?? null,
        idNumber: input.candidate.idNumber ?? null,
        nationality: input.candidate.nationality ?? null,
        yearsExperience: input.candidate.yearsExperience?.toString() ?? null,
        skills: input.candidate.skills ?? [],
      })
      .returning({ id: candidates.id })

    const [application] = await db
      .insert(applications)
      .values({
        candidateId: candidate.id,
        companyId: input.companyId,
        positionApplied: input.positionApplied,
        source: input.source,
        coverNote: input.coverNote ?? null,
      })
      .returning({ id: applications.id })

    if (requireStaff) revalidatePath('/admin/dashboard')

    return { success: true, data: { applicationId: application.id, candidateId: candidate.id } }
  } catch (error) {
    console.error('[applications.submitApplication]', error)
    return { success: false, error: 'Aanvraag kon niet worden opgeslagen. Probeer het opnieuw.' }
  }
}

/**
 * Uploadt een document (CV, scan, ID, certificaat) naar Vercel Blob en registreert het.
 */
export async function uploadApplicationDocument(
  applicationId: string,
  file: File,
  kind: DocumentKind
): Promise<ServiceResult<{ path: string }>> {
  try {
    const { url, fileName } = await uploadDocument(applicationId, file)

    await db.insert(applicationDocuments).values({
      applicationId,
      kind,
      storagePath: url,
      fileName,
    })

    return { success: true, data: { path: url } }
  } catch (error) {
    console.error('[applications.uploadApplicationDocument]', error)
    return { success: false, error: 'Document kon niet worden geüpload.' }
  }
}

/**
 * Wijzigt de status van een application en schrijft een audit-regel weg. Alleen staff.
 */
export async function updateApplicationStatus(
  applicationId: string,
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus,
  note?: string
): Promise<ServiceResult<null>> {
  try {
    const session = await requireSession(['super_admin', 'hr_staff', 'recruiter'])

    await db.update(applications).set({ status: toStatus, updatedAt: new Date() }).where(eq(applications.id, applicationId))

    await db.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus,
      toStatus,
      changedBy: session.userId,
      note: note ?? null,
    })

    revalidatePath(`/admin/applications/${applicationId}`)
    revalidatePath('/admin/dashboard')

    return { success: true, data: null }
  } catch (error) {
    console.error('[applications.updateApplicationStatus]', error)
    return { success: false, error: 'Status kon niet worden bijgewerkt.' }
  }
}
