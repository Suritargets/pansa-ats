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
  listContracts,
  listEmergencyContacts,
  listInterviewQuestions,
  listInterviews,
  listOnboardingProgress,
  listOnboardingStepTemplates,
  listReferenceChecks,
  listShareableClientsForApplication,
} from '@/services/queries'
import { buildDossierIndex, buildPreEmploymentChecklist } from '@/lib/dossier'
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
    referenceChecks,
    contracts,
    emergencyContacts,
    onboardingSteps,
    onboardingProgress,
    shareableClients,
    shares,
  ] = await Promise.all([
    listApplicationDocuments(id),
    listInterviews(id),
    listInterviewQuestions(),
    listReferenceChecks(id),
    listContracts(id),
    listEmergencyContacts(application.candidateId),
    listOnboardingStepTemplates(application.companyId),
    listOnboardingProgress(id),
    listShareableClientsForApplication(id),
    listApplicationShares(id),
  ])

  const dossierItems = buildDossierIndex({
    candidate: application.candidate,
    documents,
    interviews,
    referenceChecks,
    contracts,
    emergencyContacts,
    onboardingSteps,
    onboardingProgress,
  })
  const preEmployment = buildPreEmploymentChecklist(application.candidate, documents)

  return (
    <AdminShell session={session}>
      <ProfileSketch
        application={application}
        documents={documents}
        interviews={interviews}
        interviewQuestions={interviewQuestions}
        referenceChecks={referenceChecks}
        contracts={contracts}
        emergencyContacts={emergencyContacts}
        onboardingSteps={onboardingSteps}
        onboardingProgress={onboardingProgress}
        shareableClients={shareableClients}
        shares={shares}
        dossierItems={dossierItems}
        preEmployment={preEmployment}
      />
    </AdminShell>
  )
}
