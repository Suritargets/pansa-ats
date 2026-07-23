/**
 * admin/applications/[id]/cv/page.tsx
 * WAT:    Standalone printbare CV-pagina — buiten AdminShell zodat de sidebar niet meeprint.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getApplicationById } from '@/services/queries'
import { CandidateCv } from '@/components/admin/CandidateCv'
import { PrintButton } from '@/components/admin/PrintButton'
import { Button } from '@/components/ui/button'

export default async function CandidateCvPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession([...STAFF_ROLES])
  const { id } = await params

  const application = await getApplicationById(id)
  if (!application) notFound()

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" render={<Link href={`/admin/applications/${application.id}`} />}>
          <ArrowLeft className="size-4" />
          Terug naar profiel
        </Button>
        <PrintButton />
      </div>
      <CandidateCv application={application} />
    </div>
  )
}
