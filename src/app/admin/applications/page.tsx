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
import { ListSearchBox } from '@/components/admin/ListSearchBox'
import type { ApplicationStatus } from '@/types/database'

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { status, search } = await searchParams
  const applications = await listApplications(status as ApplicationStatus | undefined, search)

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Sollicitaties ({applications.length})</h2>
        <div className="flex items-center gap-3">
          <ListSearchBox placeholder="Zoek op naam/functie..." />
          <StatusFilter value={status ?? ''} />
        </div>
      </div>
      <ApplicationsTable applications={applications} />
    </AdminShell>
  )
}
