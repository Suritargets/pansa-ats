/**
 * system-health.ts
 * WAT:    Controles voor de pagina "Systeemstatus": instellingen, database-schema en datakwaliteit.
 * WAAROM: Eén plek om te zien of het systeem klaar is voor gebruik — ontbrekende migraties, geen mail,
 *         accounts zonder tweestapsverificatie en dossiers die aandacht nodig hebben.
 *         Elke controle vangt zijn eigen fout af, zodat één kapotte query de pagina niet breekt.
 */

import { and, count, eq, inArray, isNull, lt, lte, sql } from 'drizzle-orm'
import { is } from 'drizzle-orm'
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import { db } from './db'
import { isMailConfigured } from './mail'
import { agreementState } from './service-agreements'
import * as schema from '../../drizzle/schema'

export type HealthStatus = 'ok' | 'warn' | 'error'
export interface HealthCheck {
  key: string
  group: 'Instellingen' | 'Database' | 'Data'
  label: string
  status: HealthStatus
  detail: string
  href?: string
}

async function safe(key: string, group: HealthCheck['group'], label: string, run: () => Promise<Omit<HealthCheck, 'key' | 'group' | 'label'>>): Promise<HealthCheck> {
  try {
    return { key, group, label, ...(await run()) }
  } catch (error) {
    return { key, group, label, status: 'error', detail: error instanceof Error ? error.message : 'Controle mislukt' }
  }
}

const envCheck = (key: string, group: HealthCheck['group'], label: string, name: string, level: HealthStatus, hint: string) =>
  safe(key, group, label, async () => (process.env[name] ? { status: 'ok', detail: 'Ingesteld' } : { status: level, detail: hint }))

export async function runHealthChecks(now = new Date()): Promise<HealthCheck[]> {
  const today = now.toISOString().slice(0, 10)
  const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)
  const staleBefore = new Date(now.getTime() - 14 * 86400000)

  const tableNames = (Object.values(schema) as unknown[]).filter((v) => is(v, PgTable)).map((t) => getTableConfig(t as PgTable).name)

  return Promise.all([
    envCheck('session-secret', 'Instellingen', 'Sessiesleutel', 'SESSION_SECRET', 'error', 'SESSION_SECRET ontbreekt: niemand kan inloggen'),
    envCheck('blob', 'Instellingen', 'Bestandsopslag (Blob)', 'BLOB_READ_WRITE_TOKEN', 'warn', 'Geen token: documenten uploaden werkt niet'),
    safe('smtp', 'Instellingen', 'E-mail (SMTP)', async () =>
      isMailConfigured() ? { status: 'ok', detail: 'SMTP is ingesteld' } : { status: 'warn', detail: 'Niet ingesteld: uitnodigingen en resetmails worden overgeslagen', href: '/admin/settings/mail' }
    ),

    safe('db', 'Database', 'Verbinding', async () => {
      await db.execute(sql`select 1`)
      return { status: 'ok', detail: 'Database bereikbaar' }
    }),
    safe('tables', 'Database', 'Tabellen (migraties)', async () => {
      const res = await db.execute<{ table_name: string }>(sql`select table_name from information_schema.tables where table_schema = 'public'`)
      const rows = (Array.isArray(res) ? res : res.rows) as { table_name: string }[]
      const present = new Set(rows.map((r) => r.table_name))
      const missing = tableNames.filter((n) => !present.has(n))
      return missing.length === 0
        ? { status: 'ok', detail: `Alle ${tableNames.length} tabellen aanwezig` }
        : { status: 'error', detail: `Ontbrekend: ${missing.join(', ')} — voer de migraties uit` }
    }),

    safe('no-2fa', 'Data', 'Staff zonder tweestapsverificatie', async () => {
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.profiles)
        .where(and(eq(schema.profiles.active, true), inArray(schema.profiles.role, ['super_admin', 'hr_staff', 'recruiter']), isNull(schema.profiles.totpEnabledAt)))
      return n === 0 ? { status: 'ok', detail: 'Iedereen heeft het aan' } : { status: 'warn', detail: `${n} actieve staff-account(s) zonder`, href: '/admin/settings/users' }
    }),
    safe('mail-failed', 'Data', 'Mislukte mails', async () => {
      const [{ n }] = await db.select({ n: count() }).from(schema.mailOutbox).where(eq(schema.mailOutbox.status, 'failed'))
      return n === 0 ? { status: 'ok', detail: 'Geen mislukte mails' } : { status: 'warn', detail: `${n} mail(s) mislukt`, href: '/admin/settings/mail' }
    }),
    safe('contracts-expiring', 'Data', 'Contracten die binnen 30 dagen aflopen', async () => {
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.employmentContracts)
        .where(and(eq(schema.employmentContracts.status, 'active'), lte(schema.employmentContracts.endDate, in30), sql`${schema.employmentContracts.endDate} >= ${today}`))
      return n === 0 ? { status: 'ok', detail: 'Geen aflopende contracten' } : { status: 'warn', detail: `${n} contract(en) lopen af`, href: '/admin/contracts' }
    }),
    safe('contracts-expired', 'Data', 'Verlopen contracten nog actief', async () => {
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.employmentContracts)
        .where(and(eq(schema.employmentContracts.status, 'active'), lt(schema.employmentContracts.endDate, today)))
      return n === 0 ? { status: 'ok', detail: 'Geen' } : { status: 'error', detail: `${n} contract(en) staan nog actief na de einddatum`, href: '/admin/contracts' }
    }),
    safe('agreements', 'Data', 'Klantovereenkomsten in opzegperiode of verlopen', async () => {
      const rows = await db.select().from(schema.serviceAgreements).where(eq(schema.serviceAgreements.status, 'active'))
      const states = rows.map((a) => agreementState(a, now))
      const expired = states.filter((s) => s === 'expired').length
      const notice = states.filter((s) => s === 'notice').length
      if (expired > 0) return { status: 'error', detail: `${expired} verlopen, ${notice} in opzegperiode`, href: '/admin/agreements?state=expired' }
      if (notice > 0) return { status: 'warn', detail: `${notice} in opzegperiode`, href: '/admin/agreements?state=notice' }
      return { status: 'ok', detail: 'Geen actie nodig' }
    }),
    safe('stale-new', 'Data', 'Sollicitaties langer dan 14 dagen op "nieuw"', async () => {
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.applications)
        .where(and(eq(schema.applications.status, 'new'), lt(schema.applications.createdAt, staleBefore)))
      return n === 0 ? { status: 'ok', detail: 'Alles is opgepakt' } : { status: 'warn', detail: `${n} sollicitatie(s) wachten op beoordeling`, href: '/admin/applications?status=new' }
    }),
    safe('no-contact', 'Data', 'Kandidaten zonder e-mail én telefoon', async () => {
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.candidates)
        .where(and(sql`coalesce(${schema.candidates.email}, '') = ''`, sql`coalesce(${schema.candidates.phone}, '') = ''`))
      return n === 0 ? { status: 'ok', detail: 'Iedereen is bereikbaar' } : { status: 'warn', detail: `${n} kandidaat/kandidaten niet bereikbaar`, href: '/admin/candidates' }
    }),
  ])
}
