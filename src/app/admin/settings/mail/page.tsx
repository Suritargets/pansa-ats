/**
 * admin/settings/mail/page.tsx
 * WAT:    Overzicht van uitgaande systeemmails (status, pogingen, fouten), opnieuw proberen en een testmail —
 *         alleen super_admin. De inhoud van mails wordt bewust niet getoond (kan een eenmalige link bevatten).
 */

import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { isMailConfigured } from '@/lib/mail'
import { readSmtpConfig } from '@/lib/mail-core'
import { getTrustedAppUrl } from '@/lib/auth-links'
import { getMailStatusCounts, listMailOutbox } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { MailRowActions } from '@/components/admin/MailRowActions'
import { MailTools } from '@/components/admin/MailTools'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { MailStatus } from '../../../../../drizzle/schema'

const STATUS_LABELS: Record<MailStatus, string> = {
  pending: 'In wachtrij',
  sending: 'Bezig',
  sent: 'Verstuurd',
  failed: 'Mislukt',
  skipped: 'Overgeslagen',
}
const STATUS_VARIANT: Record<MailStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  sending: 'secondary',
  sent: 'default',
  failed: 'destructive',
  skipped: 'outline',
}
const TEMPLATE_LABELS: Record<string, string> = {
  invite: 'Uitnodiging',
  password_reset: 'Wachtwoord opnieuw instellen',
  application_received: 'Sollicitatie ontvangen',
  test: 'Testmail',
}

export default async function MailSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const [mails, counts] = await Promise.all([listMailOutbox(50), getMailStatusCounts()])
  const config = readSmtpConfig(process.env)
  const configured = isMailConfigured()
  const appUrl = getTrustedAppUrl()

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">E-mail</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Uitnodigingen, wachtwoord-resets en sollicitatiebevestigingen worden via de mailserver van Pansa verstuurd. De instellingen
        staan in Vercel (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_URL, CRON_SECRET).
      </p>

      <div className="mb-6 grid max-w-2xl gap-2 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Mailserver</span>
          <span className="text-right text-foreground">
            {config ? `${config.host}:${config.port}${config.secure ? ' (TLS)' : ''}` : 'Niet ingesteld: mails worden overgeslagen'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Afzender</span>
          <span className="text-right text-foreground">{config?.from ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Basis-URL voor links</span>
          <span className="text-right text-foreground">{appUrl ?? 'Niet ingesteld: mails met een link worden overgeslagen'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Cron-geheim</span>
          <span className="text-right text-foreground">
            {process.env.CRON_SECRET ? 'Ingesteld' : 'Niet ingesteld: de cron weigert verzoeken'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {(Object.keys(STATUS_LABELS) as MailStatus[]).map((status) => (
            <Badge key={status} variant={STATUS_VARIANT[status]}>
              {STATUS_LABELS[status]}: {counts[status] ?? 0}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aan</TableHead>
                <TableHead>Soort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nog geen mails verstuurd.
                  </TableCell>
                </TableRow>
              )}
              {mails.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="max-w-48 truncate font-medium text-foreground">{mail.toEmail}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{TEMPLATE_LABELS[mail.template] ?? mail.template}</TableCell>
                  <TableCell className="space-y-1">
                    <Badge variant={STATUS_VARIANT[mail.status]}>{STATUS_LABELS[mail.status]}</Badge>
                    {mail.attempts > 0 && <span className="ml-2 text-xs text-muted-foreground">{mail.attempts}x</span>}
                    {mail.lastError && mail.status !== 'sent' && (
                      <p className="max-w-56 text-xs break-words text-muted-foreground">{mail.lastError}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(mail.createdAt)}</TableCell>
                  <TableCell>
                    {(mail.status === 'failed' || mail.status === 'skipped') && mail.hasBody && configured && (
                      <MailRowActions id={mail.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <MailTools defaultTo={session.email} disabled={!configured} />
      </div>
    </AdminShell>
  )
}
