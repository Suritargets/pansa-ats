/**
 * seed.ts
 * WAT:    Zet de Pansa Group + subsidiaries klaar en maakt de eerste super_admin-gebruiker aan.
 * WAAROM: Vervangt de handmatige Supabase Auth-stap uit de oude README — met Neon is er geen
 *         auth-provider meer, dus we moeten zelf een eerste inlogbaar account aanmaken.
 * GEBRUIK: npm run db:seed  (leest DATABASE_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD uit .env.local)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL ontbreekt in .env.local')

  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema })

  console.log('Companies zaaien...')
  let [parent] = await db.select().from(schema.companies).where(eq(schema.companies.kind, 'parent'))
  if (!parent) {
    ;[parent] = await db
      .insert(schema.companies)
      .values({ name: 'Pansa Group of Companies N.V.', kind: 'parent', description: 'Holding — moederbedrijf' })
      .returning()
  }

  const subsidiaries = [
    { name: 'CCC H. Pansa & Sons N.V.', description: 'Manpower, outsourcing en HR-diensten voor industriële mijnbouw' },
    { name: 'Pansa Machine Shop N.V.', description: 'Machinediensten' },
    { name: 'Pansa Industries', description: 'Industriële operaties' },
  ]

  for (const sub of subsidiaries) {
    const [existing] = await db.select().from(schema.companies).where(eq(schema.companies.name, sub.name))
    if (!existing) {
      await db.insert(schema.companies).values({ ...sub, kind: 'subsidiary', parentId: parent.id })
    }
  }
  console.log(`  ${subsidiaries.length + 1} companies OK.`)

  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD niet gezet — sla admin-account over.')
  } else {
    const [existingAdmin] = await db.select().from(schema.profiles).where(eq(schema.profiles.email, adminEmail))
    if (existingAdmin) {
      console.log(`Admin-account ${adminEmail} bestaat al — overgeslagen.`)
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      await db.insert(schema.profiles).values({
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        fullName: 'Super Admin',
        role: 'super_admin',
      })
      console.log(`Admin-account aangemaakt: ${adminEmail}`)
    }
  }

  console.log('Klaar.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
