/**
 * apply/page.tsx
 * WAT:    Publieke sollicitatiepagina. Laadt companies + functiecategorieën server-side.
 */

import { ApplicationForm } from '@/components/candidate/ApplicationForm'
import { listCompanies, listJobCategories } from '@/services/queries'

export default async function ApplyPage() {
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Sollicitatieformulier</h1>
      <p className="mt-2 text-muted-foreground">
        Vul je gegevens in om te solliciteren bij Pansa Group of Companies.
      </p>
      <div className="mt-8">
        <ApplicationForm mode="public" companies={companies} jobCategories={jobCategories} />
      </div>
    </main>
  )
}
