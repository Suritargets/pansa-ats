/**
 * api/v1/applications/route.ts
 * WAT:    Publieke API om een sollicitatie aan te maken vanuit een extern systeem
 *         (bv. een eigen formulier op een andere website dat niet de iframe-embed gebruikt).
 * WAAROM: Vereist een API-sleutel met scope `applications:write` — dit endpoint kan overal
 *         vandaan met CORS aangeroepen worden, dus authenticatie kan niet op sessie leunen.
 */

import { z } from 'zod'
import { verifyApiKey } from '@/lib/api-keys'
import { jsonResponse, corsPreflight } from '@/lib/cors'
import { submitApplication } from '@/services/applications'

const bodySchema = z.object({
  companyId: z.string().uuid(),
  jobCategoryId: z.string().uuid().optional(),
  positionApplied: z.string().min(1),
  coverNote: z.string().optional(),
  candidate: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
})

export async function POST(request: Request) {
  const apiKey = await verifyApiKey(request, 'applications:write')
  if (!apiKey) return jsonResponse({ error: 'Ongeldige of ontbrekende API-sleutel.' }, { status: 401 })

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return jsonResponse({ error: 'Ongeldige payload.', issues: parsed.error.issues }, { status: 400 })
  }

  const result = await submitApplication(
    {
      companyId: parsed.data.companyId,
      jobCategoryId: parsed.data.jobCategoryId,
      positionApplied: parsed.data.positionApplied,
      source: 'online_form',
      coverNote: parsed.data.coverNote,
      candidate: parsed.data.candidate,
    },
    false
  )

  if (!result.success) return jsonResponse({ error: result.error }, { status: 500 })

  return jsonResponse({ data: { applicationId: result.data.applicationId } }, { status: 201 })
}

export function OPTIONS() {
  return corsPreflight()
}
