import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { listSharedApplicationsForClient } from '@/services/queries'
import { ClientShell } from '@/components/client/ClientShell'
import { SharedApplicationsTable } from '@/components/client/SharedApplicationsTable'

export default async function ClientDashboardPage() {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const applications = await listSharedApplicationsForClient(session.clientId)

  return (
    <ClientShell session={session}>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Gedeelde kandidaatprofielen ({applications.length})</h1>
      <SharedApplicationsTable applications={applications} />
    </ClientShell>
  )
}
