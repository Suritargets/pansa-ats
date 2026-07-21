/**
 * db.ts
 * WAT:    Drizzle client voor Neon Postgres.
 * WAAROM: DB_MODE laat de app draaien zonder DATABASE_URL (bv. lokaal zonder Neon-project) —
 *         pagina's die op DB_MODE checken vallen dan terug op lege data i.p.v. te crashen.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../drizzle/schema'

export const DB_MODE = process.env.DATABASE_URL ? 'live' : 'demo'

const sql = neon(process.env.DATABASE_URL ?? 'postgres://demo:demo@localhost/demo')

export const db = drizzle(sql, { schema })
