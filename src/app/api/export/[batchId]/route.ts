/**
 * api/export/[batchId]/route.ts
 * WAT:    Streamt een payroll-exportbatch als CSV.
 */

import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getPayrollBatchById, listPayrollBatchItems } from '@/services/queries'
import { toCsv } from '@/lib/csv'
import { formatDate } from '@/lib/utils'

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  await requireSession([...STAFF_ROLES])

  const { batchId } = await params
  const batch = await getPayrollBatchById(batchId)
  if (!batch) return NextResponse.json({ error: 'Batch niet gevonden.' }, { status: 404 })

  const items = await listPayrollBatchItems(batchId)

  const csv = toCsv(
    ['Voornaam', 'Achternaam', 'ID-nummer', 'Bedrijf', 'Functie', 'Status', 'Datum binnengekomen', 'Extern ID'],
    items.map((app) => [
      app.candidate.firstName,
      app.candidate.lastName,
      app.candidate.idNumber ?? '',
      app.company.name,
      app.positionApplied,
      app.status,
      formatDate(app.createdAt),
      app.externalEmployeeId ?? '',
    ])
  )

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payroll-batch-${batchId}.csv"`,
    },
  })
}
