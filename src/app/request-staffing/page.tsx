/**
 * request-staffing/page.tsx
 * WAT:    Publieke vacature-aanvraag — voor bedrijven zonder klantportaal-account.
 *         Landt in dezelfde inbox als de ingelogde versie (/admin/client-requests).
 */

import { listInterviewQuestions, listJobCategories } from '@/services/queries'
import { PublicShell } from '@/components/landing/PublicShell'
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
    <PublicShell
      mode="bedrijven"
      eyebrow="Voor bedrijven"
      title="Personeel aanvragen"
      intro="Vraag hier gekwalificeerd personeel aan bij Pansa Group of Companies — we nemen na ontvangst contact met je op."
    >
      <div className="max-w-3xl rounded-2xl bg-white p-6 text-[#10150f] shadow-xl sm:p-8">
        <PublicVacancyRequestForm
          jobCategories={jobCategories}
          scopeCategories={scopeCategories}
          saved={saved === '1'}
          error={error === '1'}
          redirectTo="/request-staffing"
        />
      </div>
    </PublicShell>
  )
}
