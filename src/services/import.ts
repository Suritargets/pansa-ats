'use server'

/**
 * import.ts
 * WAT:    Bulk-import van kandidaten via CSV — staff plakt/uploadt, ziet een preview
 *         (client-side geparsed), en bevestigt pas dan de daadwerkelijke insert.
 * WAAROM: Elke rij wordt als candidate + application aangemaakt via dezelfde velden als
 *         het gewone sollicitatieformulier, zodat er geen tweede databron ontstaat.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { STAFF_ROLES } from '@/lib/roles'
import type { ServiceResult } from '@/lib/service-result'
import { duplicateKey, validateRow, type ImportEntity } from '@/lib/import-fields'
import { applications, candidates, clients, suppliers } from '../../drizzle/schema'

export interface ImportCandidateRow {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  positionApplied: string
}

export async function bulkImportCandidates(
  companyId: string,
  jobCategoryId: string | null,
  rows: ImportCandidateRow[]
): Promise<ServiceResult<{ count: number }>> {
  try {
    const session = await requireSession([...STAFF_ROLES])

    const validRows = rows.filter((row) => row.firstName.trim() && row.lastName.trim() && row.positionApplied.trim())
    if (!companyId || validRows.length === 0) {
      return { success: false, error: 'Kies een bedrijf en zorg dat er geldige rijen zijn (voornaam, achternaam, functie verplicht).' }
    }

    let count = 0
    for (const row of validRows) {
      const [candidate] = await db
        .insert(candidates)
        .values({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
        })
        .returning({ id: candidates.id })

      await db.insert(applications).values({
        candidateId: candidate.id,
        companyId,
        jobCategoryId: jobCategoryId || null,
        positionApplied: row.positionApplied.trim(),
        source: 'digitized_paper',
      })

      count++
    }

    await logAuditEvent(session, 'candidates_bulk_imported', { entityType: 'application', metadata: { count, companyId } })

    revalidatePath('/admin/candidates')
    revalidatePath('/admin/applications')

    return { success: true, data: { count } }
  } catch (error) {
    console.error('[import.bulkImportCandidates]', error)
    return { success: false, error: 'Import mislukt. Probeer het opnieuw.' }
  }
}

// ---------------------------------------------------------------------------
// Import-wizard (kandidaten, klanten, leveranciers): valideren → preview → importeren
// ---------------------------------------------------------------------------

export interface ImportRowResult {
  /** Rijnummer in het bestand (1 = eerste gegevensrij). */
  row: number
  status: 'ok' | 'error' | 'duplicate'
  messages: string[]
}

const MAX_IMPORT_ROWS = 2000

/** Controleert elke rij (ook tegen bestaande gegevens en dubbelen in het bestand) zonder iets op te slaan. */
async function checkRows(entity: ImportEntity, rows: Record<string, string>[]) {
  const existing = await existingKeys(entity)
  const seen = new Set<string>()
  const results: ImportRowResult[] = []
  const valid: { row: number; values: Record<string, string> }[] = []
  rows.forEach((raw, i) => {
    const { values, errors } = validateRow(entity, raw)
    if (errors.length > 0) {
      results.push({ row: i + 1, status: 'error', messages: errors })
      return
    }
    const key = duplicateKey(entity, values)
    if (key && (existing.has(key) || seen.has(key))) {
      results.push({ row: i + 1, status: 'duplicate', messages: [existing.has(key) ? 'Bestaat al in het systeem' : 'Komt vaker voor in dit bestand'] })
      return
    }
    if (key) seen.add(key)
    results.push({ row: i + 1, status: 'ok', messages: [] })
    valid.push({ row: i + 1, values })
  })
  return { results, valid }
}

async function existingKeys(entity: ImportEntity): Promise<Set<string>> {
  const keys = new Set<string>()
  if (entity === 'candidates') {
    const rows = await db.select({ email: candidates.email, idNumber: candidates.idNumber }).from(candidates)
    for (const r of rows) {
      if (r.email) keys.add(`email:${r.email.toLowerCase()}`)
      if (r.idNumber) keys.add(`id:${r.idNumber.toLowerCase()}`)
    }
  } else if (entity === 'clients') {
    for (const r of await db.select({ name: clients.name }).from(clients)) keys.add(`name:${r.name.toLowerCase()}`)
  } else {
    for (const r of await db.select({ name: suppliers.name }).from(suppliers)) keys.add(`name:${r.name.toLowerCase()}`)
  }
  return keys
}

function guardRows(rows: Record<string, string>[]): string | null {
  if (rows.length === 0) return 'Het bestand bevat geen rijen.'
  if (rows.length > MAX_IMPORT_ROWS) return `Maximaal ${MAX_IMPORT_ROWS} rijen per import.`
  return null
}

export async function validateImport(entity: ImportEntity, rows: Record<string, string>[]): Promise<ServiceResult<ImportRowResult[]>> {
  try {
    await requireSession([...STAFF_ROLES])
    const problem = guardRows(rows)
    if (problem) return { success: false, error: problem }
    return { success: true, data: (await checkRows(entity, rows)).results }
  } catch (error) {
    console.error('[import.validateImport]', error)
    return { success: false, error: 'Controleren mislukt. Probeer het opnieuw.' }
  }
}

/** Importeert alleen de rijen die de (server-side) controle doorstaan; de rest wordt overgeslagen. */
export async function runImport(entity: ImportEntity, rows: Record<string, string>[]): Promise<ServiceResult<{ imported: number; skipped: number }>> {
  try {
    const session = await requireSession([...STAFF_ROLES])
    const problem = guardRows(rows)
    if (problem) return { success: false, error: problem }
    const { results, valid } = await checkRows(entity, rows)
    const nz = (v: string) => v || null

    if (valid.length > 0) {
      if (entity === 'candidates') {
        await db.insert(candidates).values(
          valid.map(({ values: v }) => ({
            firstName: v.firstName,
            lastName: v.lastName,
            email: nz(v.email),
            phone: nz(v.phone),
            dateOfBirth: nz(v.dateOfBirth),
            birthPlace: nz(v.birthPlace),
            gender: (v.gender || null) as 'man' | 'vrouw' | null,
            idNumber: nz(v.idNumber),
            nationality: nz(v.nationality),
            address: nz(v.address),
            residence: nz(v.residence),
            district: nz(v.district),
            notes: nz(v.notes),
          }))
        )
      } else if (entity === 'clients') {
        await db.insert(clients).values(
          valid.map(({ values: v }) => ({
            name: v.name,
            industry: nz(v.industry),
            contactName: nz(v.contactName),
            contactEmail: nz(v.contactEmail),
            contactPhone: nz(v.contactPhone),
            address: nz(v.address),
            status: (v.status || 'active') as 'prospect' | 'active' | 'inactive',
            notes: nz(v.notes),
          }))
        )
      } else {
        await db.insert(suppliers).values(
          valid.map(({ values: v }) => ({
            name: v.name,
            kind: (v.kind || 'other') as 'medical' | 'staffing' | 'insurance' | 'training' | 'government' | 'other',
            contactName: nz(v.contactName),
            contactEmail: nz(v.contactEmail),
            contactPhone: nz(v.contactPhone),
            address: nz(v.address),
            notes: nz(v.notes),
          }))
        )
      }
    }

    const skipped = results.length - valid.length
    await logAuditEvent(session, 'data_imported', { entityType: entity, metadata: { imported: valid.length, skipped } })
    revalidatePath('/admin/candidates')
    revalidatePath('/admin/clients')
    revalidatePath('/admin/suppliers')
    return { success: true, data: { imported: valid.length, skipped } }
  } catch (error) {
    console.error('[import.runImport]', error)
    return { success: false, error: 'Import mislukt. Er is niets opgeslagen of de import is onderbroken; controleer de lijst en probeer het opnieuw.' }
  }
}
