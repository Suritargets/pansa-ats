/**
 * request-staffing/page.tsx
 * WAT:    Publieke vacature-aanvraag — voor bedrijven zonder klantportaal-account.
 *         Landt in dezelfde inbox als de ingelogde versie (/admin/client-requests).
 */

import { listInterviewQuestions, listJobCategories } from '@/services/queries'
import { PublicVacancyRequestForm } from '@/components/client/PublicVacancyRequestForm'

export default async function RequestStaffingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { saved, error } = await searchParams
  const [jobCategories, workExperienceQuestions] = await Promise.all([
    listJobCategories(),
    listInterviewQuestions('work_experience'),
  ])
  const scopeCategories = [...new Set(workExperienceQuestions.map((q) => q.category ?? q.text))]

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Personeel aanvragen</h1>
      <p className="mt-2 text-muted-foreground">
        Vraag hier gekwalificeerd personeel aan bij Pansa Group of Companies — we nemen na ontvangst contact met je op.
      </p>
      <div className="mt-8">
        <PublicVacancyRequestForm
          jobCategories={jobCategories}
          scopeCategories={scopeCategories}
          saved={saved === '1'}
          error={error === '1'}
          redirectTo="/request-staffing"
        />
      </div>
    </main>
  )
}
