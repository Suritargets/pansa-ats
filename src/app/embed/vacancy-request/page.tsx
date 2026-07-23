/**
 * embed/vacancy-request/page.tsx
 * WAT:    Kale versie van de publieke vacature-aanvraag, bedoeld om via een iframe op een
 *         andere website te plaatsen (zie public/embed.js). Geen header/nav-chrome.
 */

import { listInterviewQuestions, listJobCategories } from '@/services/queries'
import { PublicVacancyRequestForm } from '@/components/client/PublicVacancyRequestForm'
import { EmbedResizeReporter } from '@/components/candidate/EmbedResizeReporter'

export default async function EmbedVacancyRequestPage({
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
    <main className="px-4 py-6">
      <EmbedResizeReporter />
      <PublicVacancyRequestForm
        jobCategories={jobCategories}
        scopeCategories={scopeCategories}
        saved={saved === '1'}
        error={error === '1'}
        redirectTo="/embed/vacancy-request"
      />
    </main>
  )
}
