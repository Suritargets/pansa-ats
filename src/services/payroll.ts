'use server'

/**
 * payroll.ts
 * WAT:    Server Action om een payroll-exportbatch aan te maken — verzamelt alle actief
 *         geplaatste kandidaten in een batch. Het daadwerkelijke CSV-bestand wordt
 *         gestreamd via src/app/api/export/[batchId]/route.ts, niet hier opgeslagen.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { applications, payrollExportBatches, payrollExportItems } from '../../drizzle/schema'

export async function createPayrollBatch(): Promise<void> {
  const session = await requireSession([...STAFF_ROLES])

  const activeApplications = await db.select().from(applications).where(eq(applications.status, 'active'))

  const [batch] = await db
    .insert(payrollExportBatches)
    .values({ requestedBy: session.userId, status: 'pending', fileFormat: 'csv' })
    .returning({ id: payrollExportBatches.id })

  if (activeApplications.length > 0) {
    await db.insert(payrollExportItems).values(
      activeApplications.map((app) => ({
        batchId: batch.id,
        applicationId: app.id,
      }))
    )
  }

  revalidatePath('/admin/export/payroll')
}
