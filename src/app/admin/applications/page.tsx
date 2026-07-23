/**
 * admin/applications/page.tsx
 * WAT:    Sollicitatiepipeline: overzicht van alle sollicitaties, filterbaar op status.
 * WAAROM: Was voorheen /admin/dashboard — die route is nu de KPI-overzichtspagina.
 */

import { requireSession } from '@/lib/auth'
import { listApplications } from '@/services/queries'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApplicationsTable } from '@/components/admin/ApplicationsTable'
import { StatusFilter } from '@/components/admin/StatusFilter'
import type { ApplicationStatus } from '@/types/database'

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
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
