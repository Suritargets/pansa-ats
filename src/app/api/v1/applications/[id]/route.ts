/**
 * api/v1/applications/[id]/route.ts
 * WAT:    Statuscheck voor één sollicitatie — voor een extern systeem dat wil pollen
 *         i.p.v. op webhooks te vertrouwen. Vereist scope `applications:read`.
 */

import { verifyApiKey } from '@/lib/api-keys'
import { jsonResponse, corsPreflight } from '@/lib/cors'
import { getApplicationById } from '@/services/queries'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = await verifyApiKey(request, 'applications:read')
  if (!apiKey) return jsonResponse({ error: 'Ongeldige of ontbrekende API-sleutel.' }, { status: 401 })

  const { id } = await params
  const application = await getApplicationById(id)
  if (!application) return jsonResponse({ error: 'Niet gevonden.' }, { status: 404 })

  return jsonResponse({
    data: {
      id: application.id,
      status: application.status,
      positionApplied: application.positionApplied,
      company: application.company.name,
      candidate: { firstName: application.candidate.firstName, lastName: application.candidate.lastName },
      createdAt: application.createdAt,
    },
  })
}

export function OPTIONS() {
  return corsPreflight()
}
