/**
 * admin/digitize/page.tsx
 * WAT:    Scherm waar staff een handgeschreven sollicitatieformulier overtypt.
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listCompanies, listJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApplicationForm } from '@/components/candidate/ApplicationForm'

export default async function DigitizePage() {
  const session = await requireSession([...STAFF_ROLES])
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <AdminShell session={session}>
      <h1 className="text-xl font-bold text-foreground">Handgeschreven aanvraag digitaliseren</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Vul de gegevens over van het papieren formulier en voeg een scan of foto toe als bewijsstuk.
      </p>
      <div className="max-w-2xl">
        <ApplicationForm mode="digitize" companies={companies} jobCategories={jobCategories} />
      </div>
    </AdminShell>
  )
}
