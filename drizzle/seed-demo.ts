/**
 * seed-demo.ts
 * WAT:    Zaait demo-kandidaten en -sollicitaties, verspreid over de hele pipeline
 *         (new -> ... -> active/rejected/withdrawn), met interviews, contracten,
 *         onboarding-voortgang en een klant-share — zodat dashboard/rapportage/
 *         portalen gevuld zijn met realistische voorbeelddata.
 * WAAROM: Leeg systeem is lastig te demonstreren of op te testen.
 * GEBRUIK: npm run db:seed-demo  (leest DATABASE_URL uit .env.local; draait ná db:seed)
 * LET OP:  Idempotent op candidate-email — opnieuw draaien maakt geen duplicaten.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and } from 'drizzle-orm'
import * as schema from './schema'
import type { ApplicationStatus } from './schema'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL ontbreekt in .env.local')

  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema })

  const companies = await db.select().from(schema.companies)
  const byCompanyName = (name: string) => {
    const c = companies.find((c) => c.name === name)
    if (!c) throw new Error(`Company "${name}" niet gevonden — draai eerst npm run db:seed`)
    return c
  }
  const hps = byCompanyName('CCC H. Pansa & Sons N.V.')
  const pms = byCompanyName('Pansa Machine Shop N.V.')
  const industries = byCompanyName('Pansa Industries')

  const [rgm] = await db.select().from(schema.clients).where(eq(schema.clients.name, 'Rosebel Gold Mines N.V. (RGM)'))
  if (!rgm) throw new Error('Demo-client RGM niet gevonden — draai eerst npm run db:seed')

  const jobCategories = await db.select().from(schema.jobCategories)
  const byJobName = (name: string) => {
    const jc = jobCategories.find((jc) => jc.name === name)
    if (!jc) throw new Error(`Functiecategorie "${name}" niet gevonden — draai eerst npm run db:seed`)
    return jc
  }

  const onboardingSteps = await db
    .select()
    .from(schema.onboardingStepTemplates)
    .orderBy(schema.onboardingStepTemplates.stepOrder)
  if (onboardingSteps.length === 0) throw new Error('Onboarding-stappen niet gevonden — draai eerst npm run db:seed')

  const [admin] = await db.select().from(schema.profiles).where(eq(schema.profiles.role, 'super_admin')).limit(1)

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

  // Statusketen tot aan de doelstatus — voor de conversion funnel / time-in-stage rapportage.
  const CHAINS: Record<ApplicationStatus, ApplicationStatus[]> = {
    new: ['new'],
    in_review: ['new', 'in_review'],
    shortlisted: ['new', 'in_review', 'shortlisted'],
    interview: ['new', 'in_review', 'shortlisted', 'interview'],
    offer: ['new', 'in_review', 'shortlisted', 'interview', 'offer'],
    onboarding: ['new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding'],
    active: ['new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding', 'active'],
    rejected: ['new', 'in_review', 'rejected'],
    withdrawn: ['new', 'in_review', 'shortlisted', 'withdrawn'],
  }

  interface DemoCandidate {
    firstName: string
    lastName: string
    email: string
    phone: string
    gender: 'man' | 'vrouw'
    dateOfBirth: string
    birthPlace: string
    residence: string
    district: string
    nationality: string
    maritalStatus: 'gehuwd' | 'ongehuwd' | 'concubinaat' | 'gescheiden'
    education: schema.EducationEntry[]
    workHistory: schema.WorkHistoryEntry[]
    skills: string[]
    yearsExperience: string
    company: schema.Company
    client?: schema.Client
    jobCategoryName: string
    status: ApplicationStatus
    source: 'online_form' | 'digitized_paper'
    interviewScore?: number
  }

  const demoCandidates: DemoCandidate[] = [
    {
      firstName: 'Ravi',
      lastName: 'Autar',
      email: 'ravi.autar@example.sr',
      phone: '08812345',
      gender: 'man',
      dateOfBirth: '1990-03-14',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'gehuwd',
      education: [{ level: 'LTS', fieldOfStudy: 'Lastechniek', completed: true }],
      workHistory: [{ period: '2018-2023', company: 'Staatsolie N.V.', role: 'Lasser', reasonForLeaving: 'Einde contract' }],
      skills: ['MIG/MAG lassen', 'TIG lassen', 'Lezen technische tekeningen'],
      yearsExperience: '7',
      company: hps,
      client: rgm,
      jobCategoryName: 'Welder',
      status: 'active',
      source: 'online_form',
    },
    {
      firstName: 'Sherida',
      lastName: 'Pinas',
      email: 'sherida.pinas@example.sr',
      phone: '08823456',
      gender: 'vrouw',
      dateOfBirth: '1995-07-22',
      birthPlace: 'Nieuw Nickerie',
      residence: 'Nieuw Nickerie',
      district: 'Nickerie',
      nationality: 'Surinaamse',
      maritalStatus: 'ongehuwd',
      education: [{ level: 'MBO', fieldOfStudy: 'Horeca', completed: true }],
      workHistory: [{ period: '2019-2024', company: 'Hotel Torarica', role: 'Kok', reasonForLeaving: 'Verhuizing' }],
      skills: ['Grootkeuken', 'HACCP', 'Menuplanning'],
      yearsExperience: '5',
      company: hps,
      client: rgm,
      jobCategoryName: 'Cook',
      status: 'onboarding',
      source: 'online_form',
    },
    {
      firstName: 'Orlando',
      lastName: 'Biervliet',
      email: 'orlando.biervliet@example.sr',
      phone: '08834567',
      gender: 'man',
      dateOfBirth: '1988-11-02',
      birthPlace: 'Paramaribo',
      residence: 'Lelydorp',
      district: 'Wanica',
      nationality: 'Surinaamse',
      maritalStatus: 'gehuwd',
      education: [{ level: 'NATIN', fieldOfStudy: 'Elektrotechniek', completed: true }],
      workHistory: [{ period: '2015-2024', company: 'N.V. EBS', role: 'Elektricien', reasonForLeaving: 'Zoekt nieuwe uitdaging' }],
      skills: ['Industriële bekabeling', 'PLC-basis', 'Storingsanalyse'],
      yearsExperience: '9',
      company: pms,
      jobCategoryName: 'Electrician',
      status: 'offer',
      source: 'online_form',
      interviewScore: 4.3,
    },
    {
      firstName: 'Angelica',
      lastName: 'Sanches',
      email: 'angelica.sanches@example.sr',
      phone: '08845678',
      gender: 'vrouw',
      dateOfBirth: '1997-01-30',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'ongehuwd',
      education: [{ level: 'VOJ/MULO', completed: true }],
      workHistory: [{ period: '2020-2024', company: 'Boskalis Suriname', role: 'Magazijnmedewerker', reasonForLeaving: 'Einde project' }],
      skills: ['Voorraadbeheer', 'Heftruck-certificaat'],
      yearsExperience: '4',
      company: hps,
      jobCategoryName: 'Warehouseman',
      status: 'interview',
      source: 'online_form',
      interviewScore: 3.8,
    },
    {
      firstName: 'Kenneth',
      lastName: 'Wongsodikromo',
      email: 'kenneth.wongsodikromo@example.sr',
      phone: '08856789',
      gender: 'man',
      dateOfBirth: '1992-05-18',
      birthPlace: 'Groningen',
      residence: 'Groningen',
      district: 'Saramacca',
      nationality: 'Surinaamse',
      maritalStatus: 'concubinaat',
      education: [{ level: 'NATIN', fieldOfStudy: 'Werktuigbouw', completed: true }],
      workHistory: [{ period: '2016-2023', company: 'Iamgold Rosebel', role: 'Monteur', reasonForLeaving: 'Contract afgelopen' }],
      skills: ['Hydrauliek', 'Diesel-motoren', 'Preventief onderhoud'],
      yearsExperience: '8',
      company: pms,
      jobCategoryName: 'Mechanic',
      status: 'shortlisted',
      source: 'online_form',
    },
    {
      firstName: 'Priscilla',
      lastName: 'Vrede',
      email: 'priscilla.vrede@example.sr',
      phone: '08867890',
      gender: 'vrouw',
      dateOfBirth: '1999-09-09',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'ongehuwd',
      education: [{ level: 'VOJ/MULO', completed: true }],
      workHistory: [],
      skills: ['Keukenassistentie', 'Hygiëne'],
      yearsExperience: '1',
      company: hps,
      jobCategoryName: 'Kitchen Helper',
      status: 'in_review',
      source: 'online_form',
    },
    {
      firstName: 'Dwight',
      lastName: 'Karsters',
      email: 'dwight.karsters@example.sr',
      phone: '08878901',
      gender: 'man',
      dateOfBirth: '1994-02-27',
      birthPlace: 'Moengo',
      residence: 'Moengo',
      district: 'Marowijne',
      nationality: 'Surinaamse',
      maritalStatus: 'ongehuwd',
      education: [{ level: 'VOJ/MULO', completed: true }],
      workHistory: [{ period: '2021-2024', company: 'G4S Suriname', role: 'Beveiliger', reasonForLeaving: 'Zoekt beter aanbod' }],
      skills: ['Toegangscontrole', 'EHBO-basis'],
      yearsExperience: '3',
      company: hps,
      jobCategoryName: 'Security',
      status: 'new',
      source: 'digitized_paper',
    },
    {
      firstName: 'Melissa',
      lastName: 'Chin A Foeng',
      email: 'melissa.chinafoeng@example.sr',
      phone: '08889012',
      gender: 'vrouw',
      dateOfBirth: '1991-06-11',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'gehuwd',
      education: [{ level: 'LBO', fieldOfStudy: 'Bouwtechniek', completed: false }],
      workHistory: [{ period: '2017-2020', company: 'Zelfstandig', role: 'Loodgieter', reasonForLeaving: 'Onvoldoende opdrachten' }],
      skills: ['PVC-leidingwerk'],
      yearsExperience: '3',
      company: pms,
      jobCategoryName: 'Plumber',
      status: 'rejected',
      source: 'online_form',
      interviewScore: 2.1,
    },
    {
      firstName: 'Randy',
      lastName: 'Sabajo',
      email: 'randy.sabajo@example.sr',
      phone: '08890123',
      gender: 'man',
      dateOfBirth: '1989-12-05',
      birthPlace: 'Brokopondo',
      residence: 'Brokopondo',
      district: 'Brokopondo',
      nationality: 'Surinaamse',
      maritalStatus: 'gescheiden',
      education: [{ level: 'VOJ/MULO', completed: true }],
      workHistory: [{ period: '2014-2024', company: 'Newmont Suriname', role: 'Haul Truck Operator', reasonForLeaving: 'Herstructurering' }],
      skills: ['CAT 777 ervaring', 'Defensief rijden'],
      yearsExperience: '10',
      company: hps,
      jobCategoryName: 'Haul Truck Operator',
      status: 'withdrawn',
      source: 'online_form',
    },
    {
      firstName: 'Farah',
      lastName: 'Radjkoemar',
      email: 'farah.radjkoemar@example.sr',
      phone: '08801234',
      gender: 'vrouw',
      dateOfBirth: '1993-04-08',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'gehuwd',
      education: [{ level: 'NATIN', fieldOfStudy: 'Werktuigbouw', completed: true }],
      workHistory: [{ period: '2017-2024', company: 'Suralco/Alcoa', role: 'Pipefitter', reasonForLeaving: 'Bedrijfssluiting' }],
      skills: ['Pijpfitten', 'Lassen (basis)', 'Isometrische tekeningen lezen'],
      yearsExperience: '7',
      company: hps,
      client: rgm,
      jobCategoryName: 'Pipefitter',
      status: 'active',
      source: 'online_form',
    },
    {
      firstName: 'Giovanni',
      lastName: 'Esajas',
      email: 'giovanni.esajas@example.sr',
      phone: '08812349',
      gender: 'man',
      dateOfBirth: '1996-08-19',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'ongehuwd',
      education: [{ level: 'NATIN', fieldOfStudy: 'Houttechniek', completed: true }],
      workHistory: [],
      skills: ['Meubelmakerij', 'Bekisting'],
      yearsExperience: '2',
      company: industries,
      jobCategoryName: 'Carpenter',
      status: 'new',
      source: 'online_form',
    },
    {
      firstName: 'Natasha',
      lastName: 'Bhola',
      email: 'natasha.bhola@example.sr',
      phone: '08823459',
      gender: 'vrouw',
      dateOfBirth: '1990-10-25',
      birthPlace: 'Paramaribo',
      residence: 'Paramaribo',
      district: 'Paramaribo',
      nationality: 'Surinaamse',
      maritalStatus: 'gehuwd',
      education: [{ level: 'NATIN', fieldOfStudy: 'Koeltechniek', completed: true }],
      workHistory: [{ period: '2018-2024', company: 'Fernandes Concern', role: 'AC-monteur', reasonForLeaving: 'Zoekt groei' }],
      skills: ['Airco-installatie', 'Koudemiddelen-certificaat'],
      yearsExperience: '6',
      company: pms,
      jobCategoryName: 'AC Technician',
      status: 'interview',
      source: 'online_form',
      interviewScore: 4.6,
    },
  ]

  let created = 0
  let skipped = 0

  for (const dc of demoCandidates) {
    const [existing] = await db.select().from(schema.candidates).where(eq(schema.candidates.email, dc.email))
    if (existing) {
      skipped++
      continue
    }

    const [candidate] = await db
      .insert(schema.candidates)
      .values({
        firstName: dc.firstName,
        lastName: dc.lastName,
        email: dc.email,
        phone: dc.phone,
        gender: dc.gender,
        dateOfBirth: dc.dateOfBirth,
        birthPlace: dc.birthPlace,
        residence: dc.residence,
        district: dc.district,
        nationality: dc.nationality,
        maritalStatus: dc.maritalStatus,
        education: dc.education,
        workHistory: dc.workHistory,
        skills: dc.skills,
        yearsExperience: dc.yearsExperience,
        availabilityDate: '2024-01-01',
        hasJusticeRecord: false,
        hasDriversLicense: true,
      })
      .returning()

    const jobCategory = byJobName(dc.jobCategoryName)
    const chain = CHAINS[dc.status]
    const [application] = await db
      .insert(schema.applications)
      .values({
        candidateId: candidate.id,
        companyId: dc.company.id,
        clientId: dc.client?.id,
        jobCategoryId: jobCategory.id,
        positionApplied: dc.jobCategoryName,
        source: dc.source,
        status: dc.status,
        assignedRecruiter: admin?.id,
        createdAt: daysAgo(chain.length * 3),
      })
      .returning()

    for (let i = 0; i < chain.length; i++) {
      await db.insert(schema.applicationStatusHistory).values({
        applicationId: application.id,
        fromStatus: i === 0 ? null : chain[i - 1],
        toStatus: chain[i],
        changedBy: admin?.id,
        createdAt: daysAgo((chain.length - i) * 3),
      })
    }

    if (dc.interviewScore !== undefined) {
      await db.insert(schema.interviews).values({
        applicationId: application.id,
        type: 'general',
        conductedBy: admin?.id,
        conductedAt: daysAgo(chain.indexOf('interview') >= 0 ? (chain.length - chain.indexOf('interview')) * 3 : 3),
        totalScore: String(dc.interviewScore * 15),
        averageScore: String(dc.interviewScore),
        notes: 'Automatisch gegenereerde demo-score.',
      })
    }

    if (['offer', 'onboarding', 'active'].includes(dc.status)) {
      await db.insert(schema.employmentContracts).values({
        applicationId: application.id,
        stage: dc.status === 'active' ? 'term_4m' : 'probation_2m',
        status: dc.status === 'active' ? 'active' : 'draft',
        startDate: '2024-02-01',
        hourlyWage: '18.50',
        createdBy: admin?.id,
      })
    }

    if (['onboarding', 'active'].includes(dc.status)) {
      const doneCount = dc.status === 'active' ? onboardingSteps.length : Math.floor(onboardingSteps.length / 2)
      for (let i = 0; i < onboardingSteps.length; i++) {
        await db.insert(schema.onboardingProgress).values({
          applicationId: application.id,
          stepTemplateId: onboardingSteps[i].id,
          status: i < doneCount ? 'done' : 'pending',
          completedAt: i < doneCount ? daysAgo(onboardingSteps.length - i) : null,
          completedBy: i < doneCount ? admin?.id : null,
        })
      }
    }

    if (dc.client) {
      await db.insert(schema.clientCandidateShares).values({
        applicationId: application.id,
        clientId: dc.client.id,
        sharedBy: admin?.id,
        clientFeedback: dc.status === 'active' ? 'Goedgekeurd, functioneert prima op locatie.' : null,
      })
    }

    created++
  }

  console.log(`${created} demo-kandidaten + sollicitaties aangemaakt, ${skipped} al aanwezig (overgeslagen).`)

  // Eén demo vacancy request vanuit de klant, zodat client-requests niet leeg is.
  const [existingRequest] = await db
    .select()
    .from(schema.clientVacancyRequests)
    .where(and(eq(schema.clientVacancyRequests.clientId, rgm.id), eq(schema.clientVacancyRequests.notes, 'Demo-aanvraag voor extra lassers op locatie.')))
  if (!existingRequest) {
    await db.insert(schema.clientVacancyRequests).values({
      clientId: rgm.id,
      jobCategoryId: byJobName('Welder').id,
      quantity: 3,
      notes: 'Demo-aanvraag voor extra lassers op locatie.',
      status: 'submitted',
    })
    console.log('1 demo vacancy-request aangemaakt.')
  }

  console.log('Klaar.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
