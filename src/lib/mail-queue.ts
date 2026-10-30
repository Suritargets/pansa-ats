/**
 * mail-queue.ts
 * WAT:    Database-kant van de mail-outbox: invoegen, atomair claimen, afronden, opnieuw proberen.
 * WAAROM: Neon-http kent geen transacties. Daarom is elke stap één statement: claimen is een
 *         `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) RETURNING`, zodat twee gelijktijdige
 *         runs (after() + cron) nooit dezelfde mail verzenden. De functies krijgen de database als
 *         parameter, zodat dezelfde queries ook tegen PGlite getest kunnen worden.
 */

import { and, asc, eq, inArray, ne, or, sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { MAX_ATTEMPTS, STUCK_AFTER_MS, backoffDelayMs } from './mail-core'
import { mailOutbox } from '../../drizzle/schema'
import type * as schema from '../../drizzle/schema'

export type MailDb = PgDatabase<PgQueryResultHKT, typeof schema>

export interface NewMail {
  template: string
  toEmail: string
  subject: string
  bodyText: string
  bodyHtml: string
  sensitive: boolean
  status: 'pending' | 'skipped'
  lastError?: string | null
  createdBy?: string | null
}

export interface ClaimedMail {
  id: string
  toEmail: string
  subject: string
  bodyText: string
  bodyHtml: string
  sensitive: boolean
  attempts: number
}

const stuckSeconds = Math.round(STUCK_AFTER_MS / 1000)
const stuckCutoff = sql`now() - (${stuckSeconds}::int * interval '1 second')`

/**
 * Een mail met een eenmalige link wordt nooit leeg opgeslagen als hij niet verzonden kan worden: bij
 * 'skipped' is de link toch nooit aangekomen, dus de inhoud hoeft niet bewaard te blijven.
 */
export async function insertMail(database: MailDb, mail: NewMail): Promise<string> {
  const wipe = mail.sensitive && mail.status === 'skipped'
  const [row] = await database
    .insert(mailOutbox)
    .values({
      template: mail.template,
      toEmail: mail.toEmail,
      subject: mail.subject,
      bodyText: wipe ? '' : mail.bodyText,
      bodyHtml: wipe ? '' : mail.bodyHtml,
      sensitive: mail.sensitive,
      status: mail.status,
      lastError: mail.lastError ?? null,
      createdBy: mail.createdBy ?? null,
    })
    .returning({ id: mailOutbox.id })
  return row.id
}

/** Rijen die te lang op 'sending' staan en geen pogingen meer over hebben, gaan op 'failed'. */
export async function failStuckMail(database: MailDb): Promise<void> {
  await database
    .update(mailOutbox)
    .set({
      status: 'failed',
      lockedAt: null,
      lastError: 'Time-out tijdens verzenden',
      bodyText: sql`case when ${mailOutbox.sensitive} then '' else ${mailOutbox.bodyText} end`,
      bodyHtml: sql`case when ${mailOutbox.sensitive} then '' else ${mailOutbox.bodyHtml} end`,
    })
    .where(and(eq(mailOutbox.status, 'sending'), sql`${mailOutbox.lockedAt} < ${stuckCutoff}`, sql`${mailOutbox.attempts} >= ${MAX_ATTEMPTS}`))
}

/**
 * Claimt maximaal `limit` verzendklare mails (optioneel beperkt tot `ids`) en telt de poging alvast mee.
 * Verzendklaar = 'pending' en aan de beurt, of 'sending' maar al te lang vastgelopen.
 */
export async function claimMail(database: MailDb, options: { ids?: string[]; limit: number }): Promise<ClaimedMail[]> {
  const ready = or(
    and(eq(mailOutbox.status, 'pending'), sql`${mailOutbox.nextAttemptAt} <= now()`),
    and(eq(mailOutbox.status, 'sending'), sql`${mailOutbox.lockedAt} < ${stuckCutoff}`)
  )
  const candidates = database
    .select({ id: mailOutbox.id })
    .from(mailOutbox)
    .where(and(ready, sql`${mailOutbox.attempts} < ${MAX_ATTEMPTS}`, options.ids ? inArray(mailOutbox.id, options.ids) : undefined))
    .orderBy(asc(mailOutbox.createdAt))
    .limit(options.limit)
    .for('update', { skipLocked: true })

  return database
    .update(mailOutbox)
    .set({ status: 'sending', attempts: sql`${mailOutbox.attempts} + 1`, lockedAt: sql`now()` })
    .where(inArray(mailOutbox.id, candidates))
    .returning({
      id: mailOutbox.id,
      toEmail: mailOutbox.toEmail,
      subject: mailOutbox.subject,
      bodyText: mailOutbox.bodyText,
      bodyHtml: mailOutbox.bodyHtml,
      sensitive: mailOutbox.sensitive,
      attempts: mailOutbox.attempts,
    })
}

/** Na verzenden: status 'sent'; een mail met een eenmalige link verliest zijn inhoud. */
export async function markMailSent(database: MailDb, id: string): Promise<void> {
  await database
    .update(mailOutbox)
    .set({
      status: 'sent',
      sentAt: sql`now()`,
      lockedAt: null,
      lastError: null,
      bodyText: sql`case when ${mailOutbox.sensitive} then '' else ${mailOutbox.bodyText} end`,
      bodyHtml: sql`case when ${mailOutbox.sensitive} then '' else ${mailOutbox.bodyHtml} end`,
    })
    .where(and(eq(mailOutbox.id, id), eq(mailOutbox.status, 'sending')))
}

/**
 * Mislukte poging: met backoff terug naar 'pending', of — na de laatste poging — 'failed'. Bij 'failed'
 * verliest een mail met een eenmalige link zijn inhoud (de link is dan waarschijnlijk verlopen).
 */
export async function markMailFailure(database: MailDb, id: string, attempts: number, error: string): Promise<'pending' | 'failed'> {
  const delay = backoffDelayMs(attempts)
  if (delay === null) {
    await database
      .update(mailOutbox)
      .set({
        status: 'failed',
        lockedAt: null,
        lastError: error,
        bodyText: sql`case when ${mailOutbox.sensitive} then '' else ${mailOutbox.bodyText} end`,
        bodyHtml: sql`case when ${mailOutbox.sensitive} then '' else ${mailOutbox.bodyHtml} end`,
      })
      .where(and(eq(mailOutbox.id, id), eq(mailOutbox.status, 'sending')))
    return 'failed'
  }
  await database
    .update(mailOutbox)
    .set({ status: 'pending', lockedAt: null, lastError: error, nextAttemptAt: sql`now() + (${delay}::int * interval '1 millisecond')` })
    .where(and(eq(mailOutbox.id, id), eq(mailOutbox.status, 'sending')))
  return 'pending'
}

/** Zet een mislukte of overgeslagen mail terug in de wachtrij. Kan niet zonder inhoud (geheime mails). */
export async function requeueMail(database: MailDb, id: string): Promise<boolean> {
  const rows = await database
    .update(mailOutbox)
    .set({ status: 'pending', attempts: 0, lastError: null, lockedAt: null, nextAttemptAt: sql`now()` })
    .where(and(eq(mailOutbox.id, id), inArray(mailOutbox.status, ['failed', 'skipped']), ne(mailOutbox.bodyText, '')))
    .returning({ id: mailOutbox.id })
  return rows.length === 1
}
