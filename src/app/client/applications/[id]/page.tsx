import { notFound, redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSharedApplicationForClient } from '@/services/queries'
import { ClientShell } from '@/components/client/ClientShell'
import { ClientApplicationView } from '@/components/client/ClientApplicationView'

export default async function ClientApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { id } = await params
  const application = await getSharedApplicationForClient(id, session.clientId)
  if (!application) notFound()

  return (
    <ClientShell session={session}>
      <ClientApplicationView application={application} />
    </ClientShell>
  )
}
