/**
 * api/export/general/route.ts
 * WAT:    Streamt alle sollicitaties/kandidaten als CSV — geen batch, geen opslag.
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listActiveApplicationsForExport } from '@/services/queries'
import { toCsv } from '@/lib/csv'
import { formatDate } from '@/lib/utils'
import { coiSummaryLines } from '@/constants/coi'
import { registrationLabel } from '@/lib/registration'

export async function GET() {
  await requireSession([...STAFF_ROLES])

  const applications = await listActiveApplicationsForExport()

  const csv = toCsv(
    [
      'Registratienr', 'Voornaam', 'Achternaam', 'ID-nummer', 'Geslacht', 'Geboortedatum', 'District', 'E-mail', 'Telefoon',
      'Datum goedgedrag', 'Familielid RGM', 'Community of Interest', 'Bedrijf', 'Functie', 'Status', 'Bron', 'Datum binnengekomen',
    ],
    applications.map((app) => [
      registrationLabel(app.candidate),
      app.candidate.firstName,
      app.candidate.lastName,
      app.candidate.idNumber ?? '',
      app.candidate.gender ?? '',
      app.candidate.dateOfBirth ?? '',
      app.candidate.district ?? '',
      app.candidate.email ?? '',
      app.candidate.phone ?? '',
      app.candidate.policeClearanceDate ?? '',
      app.candidate.relatedToStaffMember === null ? '' : app.candidate.relatedToStaffMember ? 'Ja' : 'Nee',
      coiSummaryLines(app.candidate.communityOfInterest).join('; '),
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
