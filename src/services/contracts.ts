'use server'

/**
 * contracts.ts
 * WAT:    Server Actions voor arbeidsovereenkomst-stadia (proeftijd 2mnd -> 4mnd -> 6mnd
 *         verlenging -> 12mnd verlenging -> vast), inclusief de proeftijd-evaluaties
 *         op week 4 en week 8.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { employmentContracts, type ContractStage, type ContractStatus } from '../../drizzle/schema'

export interface ContractInput {
  stage: ContractStage
  status: ContractStatus
  startDate?: string
  endDate?: string
  hourlyWage?: number
  badgeNumber?: string
  bankAccount?: string
  bankName?: string
}

export async function addContract(applicationId: string, input: ContractInput): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])

  await db.insert(employmentContracts).values({
    applicationId,
    stage: input.stage,
    status: input.status,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    hourlyWage: input.hourlyWage?.toString() ?? null,
    badgeNumber: input.badgeNumber || null,
    bankAccount: input.bankAccount || null,
    bankName: input.bankName || null,
    createdBy: session.userId,
  })

  revalidatePath(`/admin/applications/${applicationId}`)
}

export async function updateProbationNotes(
  contractId: string,
  applicationId: string,
  week: 4 | 8,
  notes: string
): Promise<void> {
  await requireSession([...STAFF_ROLES])

  await db
    .update(employmentContracts)
    .set(week === 4 ? { probationWeek4Notes: notes } : { probationWeek8Notes: notes })
    .where(eq(employmentContracts.id, contractId))

  revalidatePath(`/admin/applications/${applicationId}`)
}
