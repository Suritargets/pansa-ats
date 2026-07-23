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

  console.log('Functiecategorieën zaaien...')
  for (const jc of JOB_CATEGORIES) {
    const [existing] = await db.select().from(schema.jobCategories).where(eq(schema.jobCategories.name, jc.name))
    if (!existing) await db.insert(schema.jobCategories).values(jc)
  }
  console.log(`  ${JOB_CATEGORIES.length} functiecategorieën OK.`)

  console.log('Demo-client en leveranciers zaaien...')
  let [demoClient] = await db.select().from(schema.clients).where(eq(schema.clients.name, 'Rosebel Gold Mines N.V. (RGM)'))
  if (!demoClient) {
    ;[demoClient] = await db
      .insert(schema.clients)
      .values({
        name: 'Rosebel Gold Mines N.V. (RGM)',
        industry: 'Mijnbouw',
        status: 'active',
        notes: 'Voorbeeldklant — mijnbouwbedrijf waar kandidaten via HPS geplaatst worden.',
      })
      .returning()
  }

  const supplierSeeds: { name: string; kind: (typeof schema.supplierKindEnum.enumValues)[number] }[] = [
    { name: 'HCCO (medische keuring RGM)', kind: 'medical' },
    { name: 'Health Control (medische keuring PMS/HPS)', kind: 'medical' },
    { name: 'SOR (verzekering)', kind: 'insurance' },
  ]
  for (const s of supplierSeeds) {
    const [existing] = await db.select().from(schema.suppliers).where(eq(schema.suppliers.name, s.name))
    if (!existing) await db.insert(schema.suppliers).values(s)
  }
  console.log(`  1 demo-client + ${supplierSeeds.length} leveranciers OK.`)

  console.log('Onboarding-stappen zaaien...')
  const existingSteps = await db.select().from(schema.onboardingStepTemplates)
  if (existingSteps.length === 0) {
    for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
      await db.insert(schema.onboardingStepTemplates).values({ ...ONBOARDING_STEPS[i], stepOrder: i + 1 })
    }
    console.log(`  ${ONBOARDING_STEPS.length} onboarding-stappen OK.`)
  } else {
    console.log('  Onboarding-stappen bestaan al — overgeslagen.')
  }

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

  const clientEmail = process.env.SEED_CLIENT_EMAIL
  const clientPassword = process.env.SEED_CLIENT_PASSWORD
  if (!clientEmail || !clientPassword) {
    console.log('SEED_CLIENT_EMAIL / SEED_CLIENT_PASSWORD niet gezet — sla klant-testaccount over.')
  } else {
    const [existingClient] = await db.select().from(schema.profiles).where(eq(schema.profiles.email, clientEmail))
    if (existingClient) {
      console.log(`Klant-account ${clientEmail} bestaat al — overgeslagen.`)
    } else {
      const passwordHash = await bcrypt.hash(clientPassword, 12)
      await db.insert(schema.profiles).values({
        email: clientEmail.toLowerCase().trim(),
        passwordHash,
        fullName: 'RGM Contactpersoon',
        role: 'client',
        clientId: demoClient.id,
      })
      console.log(`Klant-testaccount aangemaakt: ${clientEmail}`)
    }
  }

  console.log('Klaar.')
}

// Van de Aanstellingsprocedure (PGC-HR-PR-0501-05) — globale stappen, geldig voor alle bedrijven.
const ONBOARDING_STEPS: { title: string; description: string }[] = [
  { title: 'Bedrijfsbeleid & regels bespreken', description: 'HR-, kwaliteits- en HSE-beleid, personeelsgids doornemen.' },
  { title: 'Arbeidsovereenkomst ondertekenen', description: 'Proeftijd 2 maanden, daarna termijn/verlengingen conform contract_stage.' },
  { title: 'Personeelsdossier aanmaken', description: 'Personeelsdossier + personeelsbestand bijwerken.' },
  { title: 'PPE aanvragen', description: 'PPE-aanvraag bij de OHSEQ-afdeling, afgifte laten ondertekenen.' },
  { title: 'Rondleiding & kennismaking', description: 'Rondleiding en kennismaking met het personeel binnen het bedrijf.' },
  { title: 'Memo nieuwe medewerker versturen', description: 'Memo naar het totale personeel mailen.' },
  { title: 'Eerste dag on-site begeleiding', description: 'Telefonisch of on-site begeleiden op de eerste werkdag bij de klant.' },
  { title: 'Proeftijdevaluatie week 4', description: 'Tussentijdse evaluatie aan de hand van de afdelingsbeschrijving.' },
  { title: 'Proeftijdevaluatie week 8', description: 'Eindevaluatie proeftijd — proeftijd beoordelingsformulier invullen en bespreken.' },
]

const JOB_CATEGORIES: { name: string; branche: (typeof schema.jobBrancheEnum.enumValues)[number]; level: (typeof schema.jobLevelEnum.enumValues)[number] }[] = [
  { name: 'AC Technician', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Baker', branche: 'hospitality_camp', level: 'skilled' },
  { name: 'Bushcutter', branche: 'mining_operations', level: 'helper' },
  { name: 'Compactor Operator', branche: 'mining_operations', level: 'operator' },
  { name: 'Drill & Blast Helper', branche: 'mining_operations', level: 'helper' },
  { name: 'Machinist', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Electrician', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Cook', branche: 'hospitality_camp', level: 'skilled' },
  { name: 'Carpenter', branche: 'trades', level: 'skilled' },
  { name: 'Dozer Operator', branche: 'mining_operations', level: 'operator' },
  { name: 'Fieldworker', branche: 'mining_operations', level: 'helper' },
  { name: 'Mechanic', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Heavy Duty Electrician', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Kitchen Helper', branche: 'hospitality_camp', level: 'helper' },
  { name: 'House Attendant', branche: 'hospitality_camp', level: 'helper' },
  { name: 'Excavator Operator', branche: 'mining_operations', level: 'operator' },
  { name: 'Lab Helper', branche: 'technical_maintenance', level: 'helper' },
  { name: 'Pipefitter', branche: 'trades', level: 'skilled' },
  { name: 'Warehouseman', branche: 'logistics_warehouse', level: 'operator' },
  { name: 'Laundry Attendant', branche: 'hospitality_camp', level: 'helper' },
  { name: 'Plumber', branche: 'trades', level: 'skilled' },
  { name: 'Haul Truck Operator', branche: 'mining_operations', level: 'operator' },
  { name: 'Mill Helper', branche: 'mining_operations', level: 'helper' },
  { name: 'Welder', branche: 'trades', level: 'skilled' },
  { name: 'Warehouse Helper', branche: 'logistics_warehouse', level: 'helper' },
  { name: 'Security', branche: 'security_safety', level: 'operator' },
  { name: 'Pump Man', branche: 'mining_operations', level: 'operator' },
  { name: 'Fuel & Lube Truck Operator', branche: 'mining_operations', level: 'operator' },
  { name: 'Millwright', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Administration', branche: 'administration_support', level: 'administrative' },
  { name: 'Safety', branche: 'security_safety', level: 'supervisor' },
  { name: 'Allrounder', branche: 'mining_operations', level: 'operator' },
  { name: 'Driver', branche: 'logistics_warehouse', level: 'operator' },
  { name: 'Tire Man', branche: 'technical_maintenance', level: 'skilled' },
  { name: 'Other', branche: 'administration_support', level: 'operator' },
]

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
