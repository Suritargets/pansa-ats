/**
 * admin/digitize/page.tsx
 * WAT:    Scherm waar staff een handgeschreven sollicitatieformulier overtypt — evt. met
 *         AI-OCR-hulp (foto/scan uploaden, automatisch invullen, controleren en opslaan).
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listCompanies, listJobCategories } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { DigitizeWorkspace } from '@/components/admin/DigitizeWorkspace'

export default async function DigitizePage() {
  const session = await requireSession([...STAFF_ROLES])
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <AdminShell session={session}>
      <h1 className="text-xl font-bold text-foreground">Handgeschreven aanvraag digitaliseren</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Upload een scan of foto van het papieren formulier voor automatisch invullen, of vul de gegevens
        handmatig over. Voeg de scan altijd toe als bewijsstuk.
      </p>
      <div className="max-w-3xl">
        <DigitizeWorkspace companies={companies} jobCategories={jobCategories} />
      </div>
    </AdminShell>
  )
}
