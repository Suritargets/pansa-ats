/**
 * admin/agreements/new/page.tsx
 * WAT:    Nieuwe dienstverlenings-overeenkomst. De klant kies je bovenaan (komt mee in de URL), daarna het formulier.
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listClients } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { AgreementForm } from '@/components/admin/AgreementForm'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export default async function NewAgreementPage({ searchParams }: { searchParams: Promise<{ clientId?: string; error?: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { clientId, error } = await searchParams
  const clients = await listClients()
  const client = clients.find((c) => c.id === clientId) ?? clients[0]

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Nieuwe overeenkomst</h1>
      {!client ? (
        <p className="text-sm text-muted-foreground">Maak eerst een klant aan.</p>
      ) : (
        <>
          <form method="get" className="mb-6 flex max-w-xl items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="clientId" className="text-sm font-medium">
                Klant
              </label>
              <select id="clientId" name="clientId" defaultValue={client.id} className={selectClasses}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-muted">
              Kiezen
            </button>
          </form>
          <AgreementForm key={client.id} clientId={client.id} error={error} />
        </>
      )}
    </AdminShell>
  )
}
