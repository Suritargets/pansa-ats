import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import Link from 'next/link'
import { getClientById, listServiceAgreements } from '@/services/queries'
import { AgreementStateBadge } from '@/components/admin/AgreementStateBadge'
import { AGREEMENT_KIND_LABELS, agreementState, currentPeriodEnd } from '@/lib/service-agreements'
import { formatDate } from '@/lib/utils'
import { AdminShell } from '@/components/admin/AdminShell'
import { ClientForm } from '@/components/admin/ClientForm'

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const session = await requireSession([...STAFF_ROLES])
  const { id } = await params
  const { saved } = await searchParams

  const client = await getClientById(id)
  if (!client) notFound()
  const agreements = await listServiceAgreements(client.id)

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">{client.name}</h1>
      <ClientForm client={client} saved={saved === '1'} />

      <section className="mt-10 max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Overeenkomsten</h2>
          <Link href={`/admin/agreements/new?clientId=${client.id}`} className="text-sm font-medium text-primary hover:underline">
            Nieuwe overeenkomst
          </Link>
        </div>
        {agreements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen overeenkomsten met deze klant.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {agreements.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <Link href={`/admin/agreements/${a.id}`} className="font-medium text-foreground hover:underline">
                    {a.title}
                  </Link>
                  <p className="text-muted-foreground">
                    {AGREEMENT_KIND_LABELS[a.kind]} · tot {formatDate(currentPeriodEnd(a))}
                  </p>
                </div>
                <AgreementStateBadge state={agreementState(a)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  )
}
