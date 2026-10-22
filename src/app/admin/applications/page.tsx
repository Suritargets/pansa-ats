/**
 * admin/applications/page.tsx
 * WAT:    Sollicitatiepipeline: overzicht van alle sollicitaties, filterbaar op status.
 * WAAROM: Was voorheen /admin/dashboard — die route is nu de KPI-overzichtspagina.
 */

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/PageHeader'
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
      <PageHeader title="Sollicitaties" subtitle="Volg elke sollicitatie van registratie tot plaatsing" count={applications.length}>
        <StatusFilter value={status ?? ''} />
        <ListSearchBox placeholder="Zoek op naam/functie..." />
        <Button nativeButton={false} render={<Link href="/admin/digitize" />}>
          <Plus className="size-4" />
          Nieuwe sollicitatie
        </Button>
      </PageHeader>
      <ApplicationsTable applications={applications} />
    </AdminShell>
  )
}
