import { notFound, redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSharedApplicationForClient, listApplicationDocuments } from '@/services/queries'
import { CLIENT_VISIBLE_DOCUMENT_KINDS } from '@/lib/document-visibility'
import { ClientShell } from '@/components/client/ClientShell'
import { ClientApplicationView } from '@/components/client/ClientApplicationView'

export default async function ClientApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { id } = await params
  const application = await getSharedApplicationForClient(id, session.clientId)
  if (!application) notFound()

  const documents = (await listApplicationDocuments(id)).filter((doc) => CLIENT_VISIBLE_DOCUMENT_KINDS.includes(doc.kind))

  return (
    <ClientShell session={session}>
      <ClientApplicationView application={application} documents={documents} />
    </ClientShell>
  )
}
