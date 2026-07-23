/**
 * admin/settings/embed/page.tsx
 * WAT:    Kant-en-klare embed-snippets om formulieren op een andere website te plaatsen
 *         (bv. de Pansa-marketingsite) — via /embed/* + public/embed.js.
 */

import { headers } from 'next/headers'
import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { EmbedSnippet } from '@/components/admin/EmbedSnippet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const EMBEDS = [
  {
    type: 'apply' as const,
    title: 'Sollicitatieformulier',
    desc: 'Kandidaten solliciteren rechtstreeks vanaf jouw website.',
    preview: '/embed/apply',
  },
  {
    type: 'vacancy-request' as const,
    title: 'Personeel aanvragen',
    desc: 'Clienten vragen personeel aan zonder klantportaal-account.',
    preview: '/embed/vacancy-request',
  },
  {
    type: 'chat' as const,
    title: 'Chat-widget',
    desc: 'Zwevende chatbubbel rechtsonder — beantwoordt vragen uit de kennisbank, automatisch in de taal van de bezoeker. Geen div nodig, enkel het scriptje.',
    preview: '/embed/chat',
  },
]

export default async function EmbedSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const headerList = await headers()
  const host = headerList.get('host') ?? 'pansa-ats.vercel.app'
  const origin = `https://${host}`

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Formulieren embedden</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Plak zo&apos;n stukje HTML op een andere website om het formulier daar rechtstreeks te tonen
        — in een automatisch meeschalende iframe. Eén script (<code className="rounded bg-muted px-1">embed.js</code>)
        ondersteunt alle onderstaande formulieren.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {EMBEDS.map((embed) => (
          <Card key={embed.type}>
            <CardHeader>
              <CardTitle className="text-sm">{embed.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{embed.desc}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <EmbedSnippet origin={origin} type={embed.type} />
              <div className="flex items-center gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  render={<a href={`${origin}${embed.preview}`} target="_blank" rel="noopener noreferrer" />}
                >
                  Voorbeeld bekijken
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  )
}
