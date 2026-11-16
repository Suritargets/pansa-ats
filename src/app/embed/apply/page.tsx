/**
 * embed/apply/page.tsx
 * WAT:    Kale versie van het sollicitatieformulier, bedoeld om via een iframe op een
 *         andere website te plaatsen (zie public/embed.js). Geen header/nav-chrome.
 *         Padding en breedte: zie EmbedFrame.
 */

import { ApplicationForm } from '@/components/candidate/ApplicationForm'
import { listCompanies, listJobCategories } from '@/services/queries'
import { EmbedFrame } from '@/components/candidate/EmbedFrame'
import { EmbedResizeReporter } from '@/components/candidate/EmbedResizeReporter'

export default async function EmbedApplyPage() {
  const [companies, jobCategories] = await Promise.all([listCompanies(), listJobCategories()])

  return (
    <EmbedFrame>
      <EmbedResizeReporter />
      <ApplicationForm mode="public" companies={companies} jobCategories={jobCategories} />
    </EmbedFrame>
  )
}
