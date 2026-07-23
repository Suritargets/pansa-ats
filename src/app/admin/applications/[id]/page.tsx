/**
 * admin/applications/[id]/page.tsx
 * WAT:    Detailpagina van één sollicitatie ("profile sketch") binnen de admin-shell.
 */

import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import {
  getApplicationById,
  listApplicationDocuments,
  listApplicationShares,
  listCandidateTrainingProgress,
  listContracts,
  listInterviewQuestions,
  listInterviews,
  listOnboardingProgress,
  listOnboardingStepTemplates,
  listShareableClientsForApplication,
  listTrainings,
} from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ProfileSketch } from '@/components/admin/ProfileSketch'

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { id } = await params

  const application = await getApplicationById(id)
  if (!application) notFound()

  const [
    documents,
    interviews,
    interviewQuestions,
    contracts,
    onboardingSteps,
    onboardingProgress,
    shareableClients,
    shares,
    trainings,
    trainingProgress,
  ] = await Promise.all([
    listApplicationDocuments(id),
    listInterviews(id),
    listInterviewQuestions(),
    listContracts(id),
    listOnboardingStepTemplates(application.companyId),
    listOnboardingProgress(id),
    listShareableClientsForApplication(id),
    listApplicationShares(id),
    listTrainings(),
    listCandidateTrainingProgress(id),
  ])

  return (
    <AdminShell session={session}>
      <ProfileSketch
        application={application}
        documents={documents}
        interviews={interviews}
        interviewQuestions={interviewQuestions}
        contracts={contracts}
        onboardingSteps={onboardingSteps}
        onboardingProgress={onboardingProgress}
        shareableClients={shareableClients}
        shares={shares}
        trainings={trainings}
        trainingProgress={trainingProgress}
      />
    </AdminShell>
  )
}
