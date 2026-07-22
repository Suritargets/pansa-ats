/**
 * client/dashboard/page.tsx
 * WAT:    Hoofdscherm van het klantportaal: sollicitaties die met dit klantbedrijf gedeeld zijn.
 */

import { requireSession } from '@/lib/auth'
import { listSharedApplicationsForClient } from '@/services/queries'
import { ClientShell } from '@/components/client/ClientShell'
import { SharedApplicationsTable } from '@/components/client/SharedApplicationsTable'

export default async function ClientDashboardPage() {
  const session = await requireSession(['client'])
  const applications = session.companyId ? await listSharedApplicationsForClient(session.companyId) : []

  return (
    <ClientShell session={session}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Gedeelde kandidaten ({applications.length})</h2>
      </div>
      <SharedApplicationsTable applications={applications} />
    </ClientShell>
  )
}
