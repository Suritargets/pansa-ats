/**
 * photos.ts
 * WAT:    Koppelt een branche aan een foto uit /public/landing, voor vacaturekaarten en -koppen.
 * WAAROM: Er zijn geen vacaturefoto's per aanvraag; één foto per branche houdt de lijst levendig
 *         zonder een upload-flow. Bestanden ontbreken? De gradient-terugval in de componenten dekt dat.
 */

import type { JobBranche } from '../../drizzle/schema'

const BRANCHE_PHOTO: Record<JobBranche, string> = {
  mining_operations: 'vacatures',
  technical_maintenance: 'nieuws',
  trades: 'trainingen',
  hospitality_camp: 'bedrijven',
  administration_support: 'sollicitatie',
  security_safety: 'profiel',
  logistics_warehouse: 'hero',
}

export function branchePhoto(branche: JobBranche | null | undefined): string {
  return `/landing/${branche ? BRANCHE_PHOTO[branche] : 'hero'}.jpg`
}
