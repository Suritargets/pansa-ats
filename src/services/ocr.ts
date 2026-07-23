'use server'

/**
 * ocr.ts
 * WAT:    Leest een foto/scan van een (handgeschreven) ingevuld Pansa-registratieformulier
 *         uit met een AI-vision-model (via Vercel AI Gateway) en zet het om naar
 *         gestructureerde formuliervelden — staff controleert/corrigeert het resultaat
 *         voordat er iets wordt opgeslagen (geen enkel veld wordt automatisch geaccepteerd).
 * WAAROM: Alleen voor de digitize-flow — het publieke sollicitatieformulier blijft
 *         handmatige invoer, dit is puur een hulpmiddel voor staff die papieren
 *         formulieren verwerkt.
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { resolveDriveShareLink } from '@/lib/drive-link'
import type { ServiceResult } from '@/lib/service-result'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const ocrSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional().describe('ISO-formaat yyyy-mm-dd indien te bepalen, anders leeg laten'),
  birthPlace: z.string().optional(),
  idNumber: z.string().optional(),
  originVillage: z.string().optional(),
  traditionalAuthority: z.string().optional(),
  address: z.string().optional(),
  residence: z.string().optional(),
  district: z.string().optional(),
  maritalStatus: z.enum(['gehuwd', 'ongehuwd', 'concubinaat', 'gescheiden']).optional(),
  gender: z.enum(['man', 'vrouw']).optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  ethnicGroup: z.string().optional(),
  hasJusticeRecord: z.boolean().optional(),
  justiceRecordReason: z.string().optional(),
  hasDriversLicense: z.boolean().optional(),
  driversLicenseCategory: z.string().optional(),
  companyNameGuess: z.string().optional().describe('Naam van het Pansa-bedrijf waarbij gesolliciteerd wordt, indien vermeld'),
  jobCategoryGuess: z.string().optional().describe('De aangevinkte functie op het formulier'),
  coverNote: z.string().optional(),
  education: z
    .array(
      z.object({
        level: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  priorTrainings: z
    .array(
      z.object({
        kind: z.string().optional(),
        title: z.string().optional(),
        period: z.string().optional(),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  workHistory: z
    .array(
      z.object({
        period: z.string().optional(),
        company: z.string().optional(),
        role: z.string().optional(),
        salary: z.string().optional(),
        reasonForLeaving: z.string().optional(),
      })
    )
    .optional(),
  workedSimilarCompanyBefore: z.boolean().optional(),
  workedSimilarCompanyDetails: z.string().optional(),
  lastJobDescription: z.string().optional(),
  lastSupervisorName: z.string().optional(),
  lastSupervisorContact: z.string().optional(),
  availabilityDate: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
})

export type OcrExtractionResult = z.infer<typeof ocrSchema>

const PROMPT = `Je krijgt een foto of scan van een ingevuld Pansa-registratieformulier
(sollicitatie bij CCC H. Pansa & Sons N.V., een manpower/outsourcing-bedrijf in Suriname).
Het formulier kan handgeschreven of getypt zijn.

Lees alle velden zo nauwkeurig mogelijk uit en zet ze om naar het gevraagde schema.
Regels:
- Laat een veld leeg (undefined) als het niet leesbaar of niet ingevuld is — verzin nooit
  een waarde.
- Data in ISO-formaat (yyyy-mm-dd) waar mogelijk; als alleen dag/maand/jaar apart leesbaar
  zijn, zet ze om.
- "Burgerlijke staat" en "geslacht" moeten exact een van de toegestane enum-waarden zijn,
  of leeg als onduidelijk.
- Het formulier heeft een lijst met aan te vinken functies (AC Technician, Baker, ... Tire
  Man, Other) — zet de aangevinkte functie letterlijk over in jobCategoryGuess.
- Werkervaring, opleiding en training zijn tabellen met meerdere rijen — geef elke
  ingevulde rij als apart item terug, sla lege rijen over.`

async function extractFromBytes(bytes: Uint8Array, mediaType: string): Promise<OcrExtractionResult> {
  const { object } = await generateObject({
    model: 'anthropic/claude-sonnet-5',
    schema: ocrSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'file', data: bytes, mediaType },
        ],
      },
    ],
  })
  return object
}

/**
 * Uploadt een scan/foto en geeft de door AI geëxtraheerde velden terug. Alleen voor staff —
 * het resultaat wordt altijd eerst in het formulier getoond ter controle, nooit direct
 * opgeslagen.
 */
export async function extractRegistrationForm(file: File): Promise<ServiceResult<OcrExtractionResult>> {
  try {
    await requireSession([...STAFF_ROLES])

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Upload een JPG, PNG, WEBP of PDF van het formulier.' }
    }
    if (file.size > MAX_SIZE_BYTES) {
      return { success: false, error: 'Bestand is te groot (max 10MB).' }
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    return { success: true, data: await extractFromBytes(bytes, file.type) }
  } catch (error) {
    console.error('[ocr.extractRegistrationForm]', error)
    return { success: false, error: 'Kon het formulier niet automatisch uitlezen. Vul handmatig in.' }
  }
}

/**
 * Zelfde als `extractRegistrationForm`, maar haalt het bestand op vanaf een URL (bv. een
 * publiek gedeelde Google Drive-link) i.p.v. een browser-upload — voor de bulk-digitaliseren-flow.
 */
export async function extractRegistrationFormFromUrl(url: string): Promise<ServiceResult<OcrExtractionResult>> {
  try {
    await requireSession([...STAFF_ROLES])

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return { success: false, error: 'Ongeldige URL.' }
    }
    if (parsed.protocol !== 'https:') {
      return { success: false, error: 'Alleen https-links worden ondersteund.' }
    }

    const resolvedUrl = resolveDriveShareLink(url)
    const response = await fetch(resolvedUrl, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) {
      return { success: false, error: `Kon het bestand niet ophalen (${response.status}). Controleer of de link publiek deelbaar is.` }
    }

    const mediaType = response.headers.get('content-type')?.split(';')[0] ?? ''
    if (!ALLOWED_TYPES.includes(mediaType)) {
      return { success: false, error: 'De link wijst niet naar een JPG, PNG, WEBP of PDF.' }
    }

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return { success: false, error: 'Bestand is te groot (max 10MB).' }
    }

    return { success: true, data: await extractFromBytes(new Uint8Array(arrayBuffer), mediaType) }
  } catch (error) {
    console.error('[ocr.extractRegistrationFormFromUrl]', error)
    return { success: false, error: 'Kon het formulier niet automatisch uitlezen vanaf de link. Vul handmatig in.' }
  }
}
