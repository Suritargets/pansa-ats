/**
 * dossier.ts
 * WAT:    Laadt alles wat nodig is voor de Index Personeelsdossier van één sollicitatie en rekent
 *         hem uit (zie lib/dossier.ts voor de regels).
 * WAAROM: Gedeeld door de afdrukpagina; de detailpagina laadt dezelfde data al voor de tabs en
 *         roept `buildDossierIndex` zelf aan. Geen 'use server': alleen voor server components.
 */

import 'server-only'
import { buildDossierIndex, buildPreEmploymentChecklist } from '@/lib/dossier'
import {
  getApplicationById,
  listApplicationDocuments,
  listContracts,
  listEmergencyContacts,
  listInterviews,
  listOnboardingProgress,
  listOnboardingStepTemplates,
  listReferenceChecks,
} from '@/services/queries'

export async function loadDossierData(applicationId: string) {
  const application = await getApplicationById(applicationId)
  if (!application) return null

  const [documents, interviews, referenceChecks, contracts, emergencyContacts, onboardingSteps, onboardingProgress] =
    await Promise.all([
      listApplicationDocuments(applicationId),
      listInterviews(applicationId),
      listReferenceChecks(applicationId),
      listContracts(applicationId),
      listEmergencyContacts(application.candidateId),
      listOnboardingStepTemplates(application.companyId),
      listOnboardingProgress(applicationId),
    ])

  const items = buildDossierIndex({
    candidate: application.candidate,
    documents,
    interviews,
    referenceChecks,
    contracts,
    emergencyContacts,
    onboardingSteps,
    onboardingProgress,
  })

  return {
    application,
    items,
    preEmployment: buildPreEmploymentChecklist(application.candidate, documents),
  }
}
