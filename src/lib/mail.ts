/**
 * mail.ts
 * WAT:    Verstuurt systeemmails via de SMTP-server van Pansa (nodemailer) met een database-outbox.
 * WAAROM: Een mail gaat eerst de outbox in en wordt daarna verzonden, zodat een trage of onbereikbare
 *         mailserver nooit een Server Action blokkeert of laat falen. `after()` verstuurt direct na de
 *         response (zoals webhooks.ts); `/api/cron/mail` is het vangnet voor mislukte en vastgelopen mails.
 *         Zonder SMTP-instellingen krijgt de rij status 'skipped' en breekt er niets.
 */

import { after } from 'next/server'
import nodemailer, { type Transporter } from 'nodemailer'
import { db, DB_MODE } from './db'
import { isPlausibleEmail, readSmtpConfig, singleLine, summarizeError, type SmtpConfig } from './mail-core'
import { claimMail, failStuckMail, insertMail, markMailFailure, markMailSent, requeueMail, type ClaimedMail } from './mail-queue'
import { renderMail, type MailData } from '@/constants/mail-templates'

const SEND_BATCH = 20

export function isMailConfigured(): boolean {
  return readSmtpConfig(process.env) !== null
}

let cachedTransport: { key: string; transport: Transporter } | null = null

function getTransport(config: SmtpConfig): Transporter {
  const key = JSON.stringify(config)
  if (cachedTransport?.key === key) return cachedTransport.transport
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  cachedTransport = { key, transport }
  return transport
}

/**
 * Zet een mail in de outbox en probeert hem direct na de response te versturen. Gooit nooit een fout:
 * een mislukte mail mag de handeling die hem veroorzaakte (account aanmaken, solliciteren) niet laten falen.
 * Geeft het outbox-id terug, of null als er niets is ingepland.
 */
export async function enqueueMail(to: string, data: MailData, options?: { createdBy?: string | null; skipReason?: string }): Promise<string | null> {
  if (DB_MODE === 'demo') return null
  try {
    const toEmail = to.trim().toLowerCase()
    if (!isPlausibleEmail(toEmail)) return null

    const rendered = renderMail(data)
    const config = readSmtpConfig(process.env)
    const id = await insertMail(db, {
      template: data.template,
      toEmail,
      subject: singleLine(rendered.subject),
      bodyText: rendered.text,
      bodyHtml: rendered.html,
      sensitive: rendered.sensitive,
      status: config && !options?.skipReason ? 'pending' : 'skipped',
      lastError: options?.skipReason ?? (config ? null : 'SMTP is niet ingesteld'),
      createdBy: options?.createdBy ?? null,
    })
    if (config && !options?.skipReason) scheduleProcessing([id])
    return id
  } catch (error) {
    console.error('[mail.enqueueMail]', error)
    return null
  }
}

function scheduleProcessing(ids: string[]): void {
  try {
    after(() => processOutbox({ ids }).then(() => undefined))
  } catch (error) {
    // Buiten een request (bv. een script) is er geen after(); de cron pakt de mail dan op.
    console.error('[mail.scheduleProcessing]', error)
  }
}

export interface ProcessResult {
  claimed: number
  sent: number
  retry: number
  failed: number
}

/** Verstuurt verzendklare mails (alleen `ids` indien opgegeven). Veilig om gelijktijdig te draaien. */
export async function processOutbox(options?: { ids?: string[]; limit?: number }): Promise<ProcessResult> {
  const result: ProcessResult = { claimed: 0, sent: 0, retry: 0, failed: 0 }
  if (DB_MODE === 'demo') return result
  const config = readSmtpConfig(process.env)
  if (!config) return result

  try {
    await failStuckMail(db)
    const claimed = await claimMail(db, { ids: options?.ids, limit: options?.limit ?? SEND_BATCH })
    result.claimed = claimed.length
    const transport = getTransport(config)
    for (const mail of claimed) {
      const outcome = await deliver(transport, config, mail)
      if (outcome === 'sent') result.sent++
      else if (outcome === 'failed') result.failed++
      else result.retry++
    }
  } catch (error) {
    console.error('[mail.processOutbox]', error)
  }
  return result
}

async function deliver(transport: Transporter, config: SmtpConfig, mail: ClaimedMail): Promise<'sent' | 'pending' | 'failed'> {
  try {
    await transport.sendMail({ from: config.from, to: mail.toEmail, subject: mail.subject, text: mail.bodyText, html: mail.bodyHtml })
    await markMailSent(db, mail.id)
    return 'sent'
  } catch (error) {
    console.error('[mail.deliver]', mail.id, summarizeError(error))
    return markMailFailure(db, mail.id, mail.attempts, summarizeError(error))
  }
}

/** Zet een mislukte/overgeslagen mail terug in de wachtrij en verstuurt hem direct na de response. */
export async function retryMail(id: string): Promise<boolean> {
  if (DB_MODE === 'demo') return false
  const queued = await requeueMail(db, id)
  if (queued && isMailConfigured()) scheduleProcessing([id])
  return queued
}
