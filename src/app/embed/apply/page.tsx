/**
 * embed/apply/page.tsx
 * WAT:    Kale versie van het sollicitatieformulier, bedoeld om via een iframe op een
 *         andere website te plaatsen (zie public/embed.js). Geen header/nav-chrome.
 */

import { ApplicationForm } from '@/components/candidate/ApplicationForm'
import { listCompanies, listJobCategories } from '@/services/queries'
import { EmbedResizeReporter } from '@/components/candidate/EmbedResizeReporter'

export default async function EmbedApplyPage() {
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <main className="px-4 py-6">
      <EmbedResizeReporter />
      <ApplicationForm mode="public" companies={companies} jobCategories={jobCategories} />
    </main>
  )
}
