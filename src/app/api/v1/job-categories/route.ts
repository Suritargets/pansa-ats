/**
 * api/v1/job-categories/route.ts
 * WAT:    Publieke, ongeauthenticeerde lijst van actieve functiecategorieën — voor embeds
 *         en externe integraties die open vacatures willen tonen.
 */

import { listJobCategories } from '@/services/queries'
import { jsonResponse, corsPreflight } from '@/lib/cors'

export async function GET() {
  const jobCategories = await listJobCategories()
  return jsonResponse({
    data: jobCategories.map((jc) => ({ id: jc.id, name: jc.name, branche: jc.branche, level: jc.level })),
  })
}

export function OPTIONS() {
  return corsPreflight()
}
