/**
 * apply/page.tsx
 * WAT:    Publieke sollicitatiepagina in de voorpagina-stijl. Laadt companies + functiecategorieën server-side.
 */

import { ApplicationForm } from '@/components/candidate/ApplicationForm'
import { PublicShell } from '@/components/landing/PublicShell'
import { listCompanies, listJobCategories } from '@/services/queries'

export default async function ApplyPage() {
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <PublicShell
      mode="werkzoeken"
      eyebrow="Werken bij Pansa"
      title="Solliciteren"
      intro="Vul je gegevens in om te solliciteren bij Pansa Group of Companies."
    >
      <div className="max-w-3xl rounded-2xl bg-white p-6 text-[#10150f] shadow-xl sm:p-8">
        <ApplicationForm mode="public" companies={companies} jobCategories={jobCategories} />
      </div>
    </PublicShell>
  )
}
