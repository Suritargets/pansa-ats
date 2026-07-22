/**
 * client/applications/[id]/page.tsx
 * WAT:    Detailpagina van één gedeelde sollicitatie binnen het klantportaal.
 * WAAROM: `getSharedApplicationForClient` scopet op session.companyId in de query zelf —
 *         een klant kan dus nooit een applicationId raden/typen die niet met hen gedeeld is.
 */

import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSharedApplicationForClient } from '@/services/queries'
import { ClientShell } from '@/components/client/ClientShell'
import { ClientApplicationView } from '@/components/client/ClientApplicationView'

export default async function ClientApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'])
  const { id } = await params

  const application = session.companyId ? await getSharedApplicationForClient(id, session.companyId) : null
  if (!application) notFound()

  return (
    <ClientShell session={session}>
      <ClientApplicationView application={application} />
    </ClientShell>
  )
}
