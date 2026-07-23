/**
 * admin/settings/api-keys/page.tsx
 * WAT:    Beheer van publieke API-sleutels voor /api/v1/* — alleen super_admin.
 */

import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listApiKeys } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApiKeyManager } from '@/components/admin/ApiKeyManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ApiKeysSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const apiKeys = await listApiKeys()

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">API-sleutels</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Voor externe systemen die met de Pansa ATS API willen praten. Stuur de sleutel mee als{' '}
        <code className="rounded bg-muted px-1">Authorization: Bearer &lt;sleutel&gt;</code>.
      </p>

      <ApiKeyManager apiKeys={apiKeys} />

      <Card className="mt-8 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm">Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Endpoint method="GET" path="/api/v1/job-categories" desc="Publiek — lijst van actieve functiecategorieën, geen sleutel nodig." />
          <Endpoint method="POST" path="/api/v1/applications" desc="Vereist scope applications:write — dient een sollicitatie in." />
          <Endpoint method="GET" path="/api/v1/applications/:id" desc="Vereist scope applications:read — status van één sollicitatie." />
        </CardContent>
      </Card>
    </AdminShell>
  )
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">{method}</span>
      <div>
        <code className="text-xs text-foreground">{path}</code>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
