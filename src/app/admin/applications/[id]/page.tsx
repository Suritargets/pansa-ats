/**
 * admin/applications/[id]/page.tsx
 * WAT:    Detailpagina van één sollicitatie ("profile sketch") binnen de admin-shell.
 */

import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getApplicationById, listApplicationDocuments } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ProfileSketch } from '@/components/admin/ProfileSketch'

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['super_admin', 'hr_staff', 'recruiter'])
  const { id } = await params

  const application = await getApplicationById(id)
  if (!application) notFound()

  const documents = await listApplicationDocuments(id)

  return (
    <AdminShell session={session}>
      <ProfileSketch application={application} documents={documents} />
    </AdminShell>
  )
}
