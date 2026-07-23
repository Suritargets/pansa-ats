/**
 * api/export/general/route.ts
 * WAT:    Streamt alle sollicitaties/kandidaten als CSV — geen batch, geen opslag.
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listActiveApplicationsForExport } from '@/services/queries'
import { toCsv } from '@/lib/csv'
import { formatDate } from '@/lib/utils'

export async function GET() {
  await requireSession([...STAFF_ROLES])

  const applications = await listActiveApplicationsForExport()

  const csv = toCsv(
    ['Voornaam', 'Achternaam', 'E-mail', 'Telefoon', 'Bedrijf', 'Functie', 'Status', 'Bron', 'Datum binnengekomen'],
    applications.map((app) => [
      app.candidate.firstName,
      app.candidate.lastName,
      app.candidate.email ?? '',
      app.candidate.phone ?? '',
      app.company.name,
      app.positionApplied,
      app.status,
      app.source,
      formatDate(app.createdAt),
    ])
  )

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pansa-ats-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
