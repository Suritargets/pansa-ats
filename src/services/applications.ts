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
import { createUploadToken, getSession, requireSession, verifyUploadToken } from '@/lib/auth'
import { uploadDocument } from '@/lib/blob'
import { logAuditEvent } from '@/lib/audit'
import { dispatchWebhookEvent } from '@/lib/webhooks'
import { enqueueMail } from '@/lib/mail'
import { STAFF_ROLES } from '@/lib/roles'
import { sanitizeCoi } from '@/constants/coi'
import { SNIFFED_MIME, sanitizeFileName, sniffFile } from '@/lib/file-sniff'
import type { ServiceResult } from '@/lib/service-result'

const MAX_DOCUMENT_SIZE_BYTES = 8 * 1024 * 1024
// Wat een sollicitant zelf mag uploaden (met uploadToken). Dossierstukken die HR verifieert of
// aanmaakt (medische keuring, SOR, getekend contract, ...) kunnen alleen met een staff-sessie.
const APPLICANT_DOCUMENT_KINDS: DocumentKind[] = [
  'cv',
  'handwritten_scan',
  'id_document',
  'certificate',
  'diploma',
  'police_clearance',
  'drivers_license',
  'photo_family_docs',
  'other',
]
import {
  applicationDocuments,
  applications,
  applicationStatusHistory,
  candidates,
  type ApplicationSource,
  type ApplicationStatus,
  type CommunityOfInterest,
  type DocumentKind,
  type EducationEntry,
  type Gender,
  type MaritalStatus,
  type PriorTrainingEntry,
  type WorkHistoryEntry,
} from '../../drizzle/schema'

export interface NewApplicationInput {
  companyId: string
  jobCategoryId?: string
  positionApplied: string
  source: ApplicationSource
  coverNote?: string
  candidate: {
    /** Nummer van het papieren registratieformulier — alleen gebruikt bij digitaliseren door staff. */
    registrationNumber?: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    dateOfBirth?: string
    birthPlace?: string
    address?: string
    residence?: string
    district?: string
    originVillage?: string
    traditionalAuthority?: string
    idNumber?: string
    nationality?: string
    maritalStatus?: MaritalStatus
    gender?: Gender
    religion?: string
    ethnicGroup?: string
    hasJusticeRecord?: boolean
    justiceRecordReason?: string
    hasDriversLicense?: boolean
    driversLicenseCategory?: string
    policeClearanceDate?: string
    communityOfInterest?: CommunityOfInterest
    education?: EducationEntry[]
    priorTrainings?: PriorTrainingEntry[]
    workHistory?: WorkHistoryEntry[]
    workedSimilarCompanyBefore?: boolean
    workedSimilarCompanyDetails?: string
    lastJobDescription?: string
    lastSupervisorName?: string
    lastSupervisorContact?: string
    availabilityDate?: string
    bankAccountNumber?: string
    bankName?: string
    relatedToStaffMember?: boolean
    relatedToStaffMemberDetails?: string
    personalCompetencies?: string
    languageSkills?: string
    yearsExperience?: number
    skills?: string[]
  }
}

/** Postgres unique_violation (23505) — ook wanneer de driver de fout als `cause` inpakt. */
function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null
  return e?.code === '23505' || e?.cause?.code === '23505'
}

/**
 * Maakt een candidate + application aan. Publiek toegankelijk (sollicitatieformulier) en
 * gebruikt door het digitaliseer-scherm (staff, sessie vereist).
 */
export async function submitApplication(
  input: NewApplicationInput,
  requireStaff = false
): Promise<ServiceResult<{ applicationId: string; candidateId: string; uploadToken: string }>> {
  try {
    if (requireStaff) await requireSession([...STAFF_ROLES])

    const [candidate] = await db
      .insert(candidates)
      .values({
        // Een publieke aanvrager mag zijn eigen registratienummer niet kiezen (uniek, door HR beheerd).
        registrationNumber: requireStaff ? input.candidate.registrationNumber?.trim() || null : null,
        firstName: input.candidate.firstName,
        lastName: input.candidate.lastName,
        email: input.candidate.email ?? null,
        phone: input.candidate.phone ?? null,
        dateOfBirth: input.candidate.dateOfBirth ?? null,
        birthPlace: input.candidate.birthPlace ?? null,
        address: input.candidate.address ?? null,
        residence: input.candidate.residence ?? null,
        district: input.candidate.district ?? null,
        originVillage: input.candidate.originVillage ?? null,
        traditionalAuthority: input.candidate.traditionalAuthority ?? null,
        idNumber: input.candidate.idNumber ?? null,
        nationality: input.candidate.nationality ?? null,
        maritalStatus: input.candidate.maritalStatus ?? null,
        gender: input.candidate.gender ?? null,
        religion: input.candidate.religion ?? null,
        ethnicGroup: input.candidate.ethnicGroup ?? null,
        hasJusticeRecord: input.candidate.hasJusticeRecord ?? null,
        justiceRecordReason: input.candidate.justiceRecordReason ?? null,
        hasDriversLicense: input.candidate.hasDriversLicense ?? null,
        driversLicenseCategory: input.candidate.driversLicenseCategory ?? null,
        policeClearanceDate: input.candidate.policeClearanceDate ?? null,
        communityOfInterest: sanitizeCoi(input.candidate.communityOfInterest),
        education: input.candidate.education ?? [],
        priorTrainings: input.candidate.priorTrainings ?? [],
        workHistory: input.candidate.workHistory ?? [],
        workedSimilarCompanyBefore: input.candidate.workedSimilarCompanyBefore ?? null,
        workedSimilarCompanyDetails: input.candidate.workedSimilarCompanyDetails ?? null,
        lastJobDescription: input.candidate.lastJobDescription ?? null,
        lastSupervisorName: input.candidate.lastSupervisorName ?? null,
        lastSupervisorContact: input.candidate.lastSupervisorContact ?? null,
        availabilityDate: input.candidate.availabilityDate ?? null,
        bankAccountNumber: input.candidate.bankAccountNumber ?? null,
        bankName: input.candidate.bankName ?? null,
        relatedToStaffMember: input.candidate.relatedToStaffMember ?? null,
        relatedToStaffMemberDetails: input.candidate.relatedToStaffMemberDetails ?? null,
        personalCompetencies: input.candidate.personalCompetencies ?? null,
        languageSkills: input.candidate.languageSkills ?? null,
        yearsExperience: input.candidate.yearsExperience?.toString() ?? null,
        skills: input.candidate.skills ?? [],
      })
      .returning({ id: candidates.id })

    const [application] = await db
      .insert(applications)
      .values({
        candidateId: candidate.id,
        companyId: input.companyId,
        jobCategoryId: input.jobCategoryId || null,
        positionApplied: input.positionApplied,
        source: input.source,
        coverNote: input.coverNote ?? null,
      })
      .returning({ id: applications.id })

    if (requireStaff) revalidatePath('/admin/applications')

    dispatchWebhookEvent('application.created', {
      applicationId: application.id,
      candidateId: candidate.id,
      firstName: input.candidate.firstName,
      lastName: input.candidate.lastName,
      positionApplied: input.positionApplied,
      source: input.source,
    })

    // Bevestiging alleen bij een publieke inzending; staff die een papieren formulier digitaliseert stuurt er geen.
    if (!requireStaff && input.candidate.email) {
      await enqueueMail(input.candidate.email, {
        template: 'application_received',
        name: input.candidate.firstName,
        position: input.positionApplied,
      })
    }

    return {
      success: true,
      data: {
        applicationId: application.id,
        candidateId: candidate.id,
        uploadToken: createUploadToken(application.id),
      },
    }
  } catch (error) {
    console.error('[applications.submitApplication]', error)
    if (isUniqueViolation(error)) {
      return { success: false, error: 'Dit registratienummer is al in gebruik bij een andere kandidaat.' }
    }
    return { success: false, error: 'Aanvraag kon niet worden opgeslagen. Probeer het opnieuw.' }
  }
}

/**
 * Uploadt een document (CV, scan, ID, certificaat) naar Vercel Blob en registreert het.
 * Toegestaan voor: een ingelogde staff-sessie, of de aanroeper die het `uploadToken`
 * heeft dat `submitApplication` net voor déze applicationId teruggaf (bindt de publieke
 * upload aan de application die de aanroeper zelf zojuist aanmaakte).
 */
export async function uploadApplicationDocument(
  applicationId: string,
  file: File,
  kind: DocumentKind,
  uploadToken: string
): Promise<ServiceResult<{ path: string }>> {
  try {
    const session = await getSession()
    const isStaff = session ? STAFF_ROLES.includes(session.role as (typeof STAFF_ROLES)[number]) : false

    if (!isStaff && !verifyUploadToken(applicationId, uploadToken)) {
      return { success: false, error: 'Niet geautoriseerd.' }
    }
    if (!isStaff && !APPLICANT_DOCUMENT_KINDS.includes(kind)) {
      return { success: false, error: 'Dit documenttype kan alleen door HR worden toegevoegd.' }
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return { success: false, error: 'Bestand is te groot (max 8MB).' }
    }
    // `file.type` komt van de browser en is te vervalsen: we vertrouwen alleen de echte inhoud.
    const sniffed = await sniffFile(file)
    if (!sniffed) {
      return { success: false, error: 'Bestandstype niet toegestaan. Gebruik JPG, PNG, WEBP of PDF.' }
    }
    const safeFile = new File([file], sanitizeFileName(file.name), { type: SNIFFED_MIME[sniffed] })

    const { pathname, fileName } = await uploadDocument(applicationId, safeFile)

    await db.insert(applicationDocuments).values({
      applicationId,
      kind,
      storagePath: pathname,
      fileName,
      uploadedBy: isStaff ? session!.userId : null,
    })

    return { success: true, data: { path: pathname } }
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
    const session = await requireSession([...STAFF_ROLES])

    await db.update(applications).set({ status: toStatus, updatedAt: new Date() }).where(eq(applications.id, applicationId))

    await db.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus,
      toStatus,
      changedBy: session.userId,
      note: note ?? null,
    })

    await logAuditEvent(session, 'application_status_changed', {
      entityType: 'application',
      entityId: applicationId,
      metadata: { fromStatus, toStatus, note: note ?? null },
    })

    dispatchWebhookEvent('application.status_changed', { applicationId, fromStatus, toStatus, note: note ?? null })

    revalidatePath(`/admin/applications/${applicationId}`)
    revalidatePath('/admin/applications')

    return { success: true, data: null }
  } catch (error) {
    console.error('[applications.updateApplicationStatus]', error)
    return { success: false, error: 'Status kon niet worden bijgewerkt.' }
  }
}
