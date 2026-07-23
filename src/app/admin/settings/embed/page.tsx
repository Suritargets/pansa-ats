/**
 * admin/settings/embed/page.tsx
 * WAT:    Kant-en-klare embed-snippet om het sollicitatieformulier op een andere website
 *         te plaatsen (bv. hpsnv-website) — via /embed/apply + public/embed.js.
 */

import { headers } from 'next/headers'
import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { EmbedSnippet } from '@/components/admin/EmbedSnippet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function EmbedSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const headerList = await headers()
  const host = headerList.get('host') ?? 'pansa-ats.vercel.app'
  const origin = `https://${host}`

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Formulier embedden</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Plak dit stukje HTML op een andere website (bv. de Pansa-marketingsite) om het
        sollicitatieformulier daar rechtstreeks te tonen — in een automatisch meeschalende iframe.
      </p>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Embed-code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmbedSnippet origin={origin} />
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              render={<a href={`${origin}/embed/apply`} target="_blank" rel="noopener noreferrer" />}
            >
              Voorbeeld bekijken
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
