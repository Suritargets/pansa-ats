/**
 * coi.ts
 * WAT:    Local Community of Interest (COI) — de vier vragen + gebiedenlijst uit het CV-sjabloon
 *         (PGC-HR-F-0503-05, blok "District Brokopondo"). RGM houdt per contractor bij of die
 *         uit het district Brokopondo / Klein Saramacca-gebied komt of ermee verbonden is.
 * WAAROM: Eén bron voor formulier, bewerkpaneel, CV en CSV — zodat de gebieden en vraagteksten
 *         niet op vier plekken uit elkaar lopen.
 */

import type { CommunityOfInterest } from '../../drizzle/schema'

export const COI_AREAS = [
  'Balingsoela',
  'Brownsweg',
  'Klaaskreek',
  'Kwakoegron',
  'Marshallkreek',
  'Nieuw Koffiekamp',
  'Nieuw Lombe',
  'Baling',
  'Bilawatra',
  'Misalibi',
  'Nieuw Jacobkondre',
] as const

type YesKey = 'bornInArea' | 'spouseFromArea' | 'parentsFromArea' | 'resident'
type AreaKey = 'bornArea' | 'spouseArea' | 'parentsArea' | 'residentArea'

export const COI_QUESTIONS: { yesKey: YesKey; areaKey: AreaKey; label: string; short: string }[] = [
  {
    yesKey: 'bornInArea',
    areaKey: 'bornArea',
    label: 'Geboren in het district Brokopondo of het Klein Saramacca gebied',
    short: 'Geboren in gebied',
  },
  {
    yesKey: 'spouseFromArea',
    areaKey: 'spouseArea',
    label: 'Getrouwd of samenwonend met iemand uit het district Brokopondo of het Klein Saramacca gebied',
    short: 'Partner uit gebied',
  },
  {
    yesKey: 'parentsFromArea',
    areaKey: 'parentsArea',
    label: 'Ouder(s) geboren in het district Brokopondo of het Klein Saramacca gebied',
    short: 'Ouder(s) uit gebied',
  },
  {
    yesKey: 'resident',
    areaKey: 'residentArea',
    label: 'Community of Interest (COI) Resident',
    short: 'COI-bewoner',
  },
]

const MAX_AREA_LENGTH = 60

/**
 * Server-side opschoning van een COI-object uit een formulier of API-aanroep: alleen de bekende
 * sleutels, booleans als booleans, gebieden als korte tekst. `null` als er niets is aangevinkt.
 */
export function sanitizeCoi(raw: unknown): CommunityOfInterest | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>
  const coi: CommunityOfInterest = {}
  let touched = false
  for (const q of COI_QUESTIONS) {
    if (input[q.yesKey] !== true) continue
    coi[q.yesKey] = true
    const rawArea = input[q.areaKey]
    const area = typeof rawArea === 'string' ? rawArea.trim().slice(0, MAX_AREA_LENGTH) : ''
    if (area) coi[q.areaKey] = area
    touched = true
  }
  return touched ? coi : null
}

/** Leest de plat-benoemde formuliervelden (`coi_<yesKey>` / `coi_<areaKey>`) van een native FormData. */
export function coiFromFormData(formData: FormData): CommunityOfInterest | null {
  const coi: CommunityOfInterest = {}
  let touched = false
  for (const q of COI_QUESTIONS) {
    const yes = formData.get(`coi_${q.yesKey}`) === 'on'
    const area = String(formData.get(`coi_${q.areaKey}`) ?? '').trim().slice(0, MAX_AREA_LENGTH)
    if (yes) {
      coi[q.yesKey] = true
      if (area) coi[q.areaKey] = area
      touched = true
    }
  }
  return touched ? coi : null
}

/** Zelfde als `coiFromFormData`, voor de object-vorm die react-hook-form teruggeeft. */
export function coiFromValues(values: Partial<Record<string, boolean | string | undefined>> | undefined): CommunityOfInterest | undefined {
  if (!values) return undefined
  const coi: CommunityOfInterest = {}
  let touched = false
  for (const q of COI_QUESTIONS) {
    if (values[q.yesKey] === true) {
      coi[q.yesKey] = true
      const area = String(values[q.areaKey] ?? '').trim()
      if (area) coi[q.areaKey] = area
      touched = true
    }
  }
  return touched ? coi : undefined
}

/** Eén regel per "ja"-antwoord, bv. "Geboren in gebied: Brownsweg". Leeg als er niets is aangevinkt. */
export function coiSummaryLines(coi: CommunityOfInterest | null | undefined): string[] {
  if (!coi) return []
  return COI_QUESTIONS.filter((q) => coi[q.yesKey]).map((q) => {
    const area = coi[q.areaKey]
    return area ? `${q.short}: ${area}` : q.short
  })
}

export function hasCoiConnection(coi: CommunityOfInterest | null | undefined): boolean {
  return COI_QUESTIONS.some((q) => coi?.[q.yesKey])
}
