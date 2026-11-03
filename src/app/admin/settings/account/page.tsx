/**
 * admin/settings/account/page.tsx
 * WAT:    Eigen account voor elke staff-gebruiker: gegevens zien, het wachtwoord wijzigen en
 *         tweestapsverificatie beheren.
 */

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { ChangePasswordForm } from '@/components/shared/AccountForms'
import { TwoFactorCard } from '@/components/shared/TwoFactorCard'
import { profiles } from '../../../../../drizzle/schema'

export default async function AccountPage() {
  const session = await requireSession([...STAFF_ROLES])
  const [me] = await db.select({ totpEnabledAt: profiles.totpEnabledAt }).from(profiles).where(eq(profiles.id, session.userId))

  return (
    <AdminShell session={session}>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Mijn account</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {session.fullName} · {session.email}
      </p>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Wachtwoord wijzigen</h2>
      <ChangePasswordForm />
      <p className="mt-4 max-w-md text-xs text-muted-foreground">
        Na een wijziging worden je andere apparaten en browsers uitgelogd; op dit apparaat blijf je ingelogd.
      </p>
      <div className="mt-8">
        <TwoFactorCard enabled={me?.totpEnabledAt != null} />
      </div>
    </AdminShell>
  )
}
