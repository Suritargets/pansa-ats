/**
 * admin/digitize/page.tsx
 * WAT:    Scherm waar staff een handgeschreven sollicitatieformulier overtypt.
 */

import { requireSession } from '@/lib/auth'
import { listCompanies } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApplicationForm } from '@/components/candidate/ApplicationForm'

export default async function DigitizePage() {
  const session = await requireSession(['super_admin', 'hr_staff', 'recruiter'])
  const companies = await listCompanies()

  return (
    <AdminShell session={session}>
      <h1 className="text-xl font-bold text-foreground">Handgeschreven aanvraag digitaliseren</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Vul de gegevens over van het papieren formulier en voeg een scan of foto toe als bewijsstuk.
      </p>
      <div className="max-w-2xl">
        <ApplicationForm mode="digitize" companies={companies} />
      </div>
    </AdminShell>
  )
}
