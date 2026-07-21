/**
 * admin/dashboard/page.tsx
 * WAT:    Hoofdscherm voor staff: overzicht van alle sollicitaties, filterbaar op status.
 */

import { requireSession } from '@/lib/auth'
import { listApplications } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApplicationsTable } from '@/components/admin/ApplicationsTable'
import { StatusFilter } from '@/components/admin/StatusFilter'
import type { ApplicationStatus } from '@/types/database'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireSession(['super_admin', 'hr_staff', 'recruiter'])
  const { status } = await searchParams
  const applications = await listApplications(status as ApplicationStatus | undefined)

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Sollicitaties ({applications.length})</h2>
        <StatusFilter value={status ?? ''} />
      </div>
      <ApplicationsTable applications={applications} />
    </AdminShell>
  )
}
