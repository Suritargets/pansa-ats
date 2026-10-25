/**
 * client/applications/[id]/cv/page.tsx
 * WAT:    Printbare CV-pagina voor de klantportaal — buiten ClientShell zodat de topbar niet
 *         meeprint. Toont hetzelfde CV-sjabloon als de staff-versie: dit IS het document dat
 *         in het echte proces met de client wordt gedeeld voor de client-interview/test-fase.
 * WAAROM: Scoped op `session.clientId` via `getSharedApplicationForClient` — een client kan
 *         alleen het CV zien van een sollicitatie die expliciet met zijn bedrijf is gedeeld.
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getSharedApplicationForClient } from '@/services/queries'
import { CandidateCv } from '@/components/admin/CandidateCv'
import { PrintButton } from '@/components/admin/PrintButton'
import { Button } from '@/components/ui/button'

export default async function ClientCandidateCvPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { id } = await params
  const application = await getSharedApplicationForClient(id, session.clientId)
  if (!application) notFound()

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" render={<Link href={`/client/applications/${application.id}`} />}>
          <ArrowLeft className="size-4" />
          Terug naar profiel
        </Button>
        <PrintButton />
      </div>
      <CandidateCv application={application} />
    </div>
  )
}
