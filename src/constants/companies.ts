/**
 * companies.ts
 * WAT:    Statische referentielijst van Pansa Group + subsidiaries en functies.
 * WAAROM: Gebruikt in het sollicitatieformulier zodat kandidaten kunnen kiezen
 *         voor welk bedrijf/functie ze solliciteren, zonder een extra DB-call
 *         nodig te hebben op de publieke pagina.
 * LET OP: De echte 'company_id' (UUID) komt uit de database (tabel `companies`).
 *         Deze slugs worden gebruikt om de juiste company op te zoeken bij submit.
 */

export const PANSA_SUBSIDIARIES = [
  {
    slug: 'hpsnv',
    name: 'CCC H. Pansa & Sons N.V.',
    tagline: 'Manpower, outsourcing & HR-diensten voor industriële mijnbouw',
  },
  {
    slug: 'machine-shop',
    name: 'Pansa Machine Shop N.V.',
    tagline: 'Machinediensten',
  },
  {
    slug: 'industries',
    name: 'Pansa Industries',
    tagline: 'Industriële operaties',
  },
] as const

/**
 * Fallback-lijst voor het sollicitatieformulier wanneer er geen DB-verbinding is
 * (DB_MODE 'demo'). In normale werking komt de functielijst uit `job_categories`
 * via `listJobCategories()` — dit is alleen een offline-vangnet, geen bron van waarheid.
 */
export const FALLBACK_POSITIONS = [
  'Mechanic',
  'Welder',
  'Electrician',
  'Driver',
  'Security',
  'Administration',
  'Allrounder',
  'Other',
] as const
