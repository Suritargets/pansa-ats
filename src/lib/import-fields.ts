/**
 * import-fields.ts
 * WAT:    Velddefinities, kolom-koppeling en rij-validatie voor de import-wizard (kandidaten, klanten, leveranciers).
 * WAAROM: Puur (geen database, geen React), zodat client en server dezelfde regels gebruiken en ze testbaar zijn.
 *         Rijen met fouten worden overgeslagen, nooit half geïmporteerd.
 */

export type ImportEntity = 'candidates' | 'clients' | 'suppliers'

export interface ImportField {
  key: string
  label: string
  required?: boolean
  /** Andere kolomnamen waaronder dit veld vaak in een bestand staat (kleine letters, zonder leestekens). */
  aliases?: string[]
}

export const IMPORT_ENTITIES: { value: ImportEntity; label: string; href: string }[] = [
  { value: 'candidates', label: 'Kandidaten', href: '/admin/candidates' },
  { value: 'clients', label: 'Klanten', href: '/admin/clients' },
  { value: 'suppliers', label: 'Leveranciers & relaties', href: '/admin/suppliers' },
]

export const IMPORT_FIELDS: Record<ImportEntity, ImportField[]> = {
  candidates: [
    { key: 'firstName', label: 'Voornaam', required: true, aliases: ['first name', 'voornamen', 'given name'] },
    { key: 'lastName', label: 'Achternaam', required: true, aliases: ['last name', 'familienaam', 'surname'] },
    { key: 'email', label: 'E-mail', aliases: ['e mail', 'emailadres', 'mail'] },
    { key: 'phone', label: 'Telefoon', aliases: ['telefoonnummer', 'tel', 'mobiel', 'phone number', 'gsm'] },
    { key: 'dateOfBirth', label: 'Geboortedatum', aliases: ['date of birth', 'geb datum', 'dob'] },
    { key: 'birthPlace', label: 'Geboorteplaats', aliases: ['birth place', 'place of birth'] },
    { key: 'gender', label: 'Geslacht', aliases: ['gender', 'sex', 'm v'] },
    { key: 'idNumber', label: 'ID-nummer', aliases: ['id nummer', 'identiteitsnummer', 'id number', 'idnr'] },
    { key: 'nationality', label: 'Nationaliteit', aliases: ['nationality'] },
    { key: 'address', label: 'Adres', aliases: ['straat', 'address'] },
    { key: 'residence', label: 'Woonplaats', aliases: ['plaats', 'city', 'residence'] },
    { key: 'district', label: 'District', aliases: ['distrikt'] },
    { key: 'notes', label: 'Notities', aliases: ['opmerkingen', 'notes', 'opmerking'] },
  ],
  clients: [
    { key: 'name', label: 'Naam', required: true, aliases: ['bedrijfsnaam', 'klant', 'company', 'company name', 'name'] },
    { key: 'industry', label: 'Branche', aliases: ['sector', 'industry'] },
    { key: 'contactName', label: 'Contactpersoon', aliases: ['contact', 'contact name', 'contactnaam'] },
    { key: 'contactEmail', label: 'E-mail contactpersoon', aliases: ['email', 'e mail', 'contact email', 'mail'] },
    { key: 'contactPhone', label: 'Telefoon contactpersoon', aliases: ['telefoon', 'phone', 'tel', 'contact phone'] },
    { key: 'address', label: 'Adres', aliases: ['address'] },
    { key: 'status', label: 'Status', aliases: ['klantstatus'] },
    { key: 'notes', label: 'Notities', aliases: ['opmerkingen', 'notes'] },
  ],
  suppliers: [
    { key: 'name', label: 'Naam', required: true, aliases: ['leverancier', 'bedrijfsnaam', 'supplier', 'name'] },
    { key: 'kind', label: 'Soort', aliases: ['type', 'kind', 'categorie'] },
    { key: 'contactName', label: 'Contactpersoon', aliases: ['contact', 'contact name', 'contactnaam'] },
    { key: 'contactEmail', label: 'E-mail contactpersoon', aliases: ['email', 'e mail', 'contact email', 'mail'] },
    { key: 'contactPhone', label: 'Telefoon contactpersoon', aliases: ['telefoon', 'phone', 'tel', 'contact phone'] },
    { key: 'address', label: 'Adres', aliases: ['address'] },
    { key: 'notes', label: 'Notities', aliases: ['opmerkingen', 'notes'] },
  ],
}

/** Voorbeeldrijen: ze slagen voor de validatie en laten de verwachte notatie zien. */
export const IMPORT_EXAMPLES: Record<ImportEntity, Record<string, string>[]> = {
  candidates: [
    { firstName: 'Anita', lastName: 'Ramdin', email: 'anita.ramdin@example.com', phone: '812-3456', dateOfBirth: '1994-03-21', birthPlace: 'Paramaribo', gender: 'vrouw', idNumber: '', nationality: 'Surinaams', address: 'Kwattaweg 120', residence: 'Paramaribo', district: 'Paramaribo', notes: 'Voorbeeldrij, verwijder vóór importeren' },
    { firstName: 'Kevin', lastName: 'Soekhoe', email: '', phone: '471-2345', dateOfBirth: '21-07-1990', birthPlace: '', gender: 'man', idNumber: '', nationality: '', address: '', residence: 'Lelydorp', district: 'Wanica', notes: '' },
  ],
  clients: [
    { name: 'Voorbeeld Bedrijf N.V.', industry: 'Productie', contactName: 'Rina Mohan', contactEmail: 'rina@example.com', contactPhone: '812-3456', address: 'Paramaribo', status: 'actief', notes: 'Voorbeeldrij, verwijder vóór importeren' },
  ],
  suppliers: [
    { name: 'Medisch Centrum Voorbeeld', kind: 'medisch', contactName: 'Dr. Lie', contactEmail: '', contactPhone: '', address: '', notes: 'Voorbeeldrij, verwijder vóór importeren' },
  ],
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Eerste gok: elk veld krijgt de kolom waarvan de naam gelijk is aan label, sleutel of alias. Een kolom wordt nooit twee keer gebruikt. */
export function autoMap(headers: string[], fields: ImportField[]): Record<string, string> {
  const map: Record<string, string> = {}
  const used = new Set<string>()
  for (const f of fields) {
    const candidates = [f.label, f.key, ...(f.aliases ?? [])].map(norm)
    const hit = headers.find((h) => !used.has(h) && candidates.includes(norm(h)))
    if (hit) {
      map[f.key] = hit
      used.add(hit)
    }
  }
  return map
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Datum als yyyy-mm-dd, dd-mm-yyyy of dd/mm/yyyy → ISO; null bij een ongeldige datum. */
export function parseDate(input: string): string | null {
  const s = input.trim()
  let y: number
  let m: number
  let d: number
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)
  if (match) {
    y = Number(match[1])
    m = Number(match[2])
    d = Number(match[3])
  } else if ((match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) {
    d = Number(match[1])
    m = Number(match[2])
    y = Number(match[3])
  } else {
    return null
  }
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const GENDER: Record<string, 'man' | 'vrouw'> = { m: 'man', man: 'man', male: 'man', mannelijk: 'man', v: 'vrouw', vrouw: 'vrouw', f: 'vrouw', female: 'vrouw', vrouwelijk: 'vrouw' }
const CLIENT_STATUS: Record<string, 'prospect' | 'active' | 'inactive'> = { prospect: 'prospect', active: 'active', actief: 'active', inactive: 'inactive', inactief: 'inactive' }
const SUPPLIER_KIND: Record<string, 'medical' | 'staffing' | 'insurance' | 'training' | 'government' | 'other'> = {
  medical: 'medical', medisch: 'medical', staffing: 'staffing', uitzend: 'staffing', uitzendbureau: 'staffing', insurance: 'insurance', verzekering: 'insurance',
  training: 'training', opleiding: 'training', government: 'government', overheid: 'government', other: 'other', overig: 'other',
}

export interface ValidatedRow {
  /** Genormaliseerde waarden (datums ISO, enums intern). */
  values: Record<string, string>
  errors: string[]
}

/** Valideert en normaliseert één rij (sleutel → tekst). Lege optionele cellen blijven leeg. */
export function validateRow(entity: ImportEntity, raw: Record<string, string>): ValidatedRow {
  const values: Record<string, string> = {}
  const errors: string[] = []
  for (const f of IMPORT_FIELDS[entity]) {
    const v = (raw[f.key] ?? '').trim()
    if (f.required && !v) errors.push(`${f.label} is verplicht`)
    values[f.key] = v
  }
  const emailKey = entity === 'candidates' ? 'email' : 'contactEmail'
  if (values[emailKey] && !EMAIL_RE.test(values[emailKey])) errors.push('E-mail is ongeldig')

  if (entity === 'candidates') {
    if (values.dateOfBirth) {
      const iso = parseDate(values.dateOfBirth)
      if (!iso) errors.push('Geboortedatum is ongeldig (gebruik jjjj-mm-dd of dd-mm-jjjj)')
      else values.dateOfBirth = iso
    }
    if (values.gender) {
      const g = GENDER[norm(values.gender)]
      if (!g) errors.push('Geslacht moet man of vrouw zijn')
      else values.gender = g
    }
  }
  if (entity === 'clients' && values.status) {
    const s = CLIENT_STATUS[norm(values.status)]
    if (!s) errors.push('Status moet prospect, actief of inactief zijn')
    else values.status = s
  }
  if (entity === 'suppliers' && values.kind) {
    const k = SUPPLIER_KIND[norm(values.kind)]
    if (!k) errors.push('Soort is onbekend (medisch, uitzend, verzekering, opleiding, overheid of overig)')
    else values.kind = k
  }
  return { values, errors }
}

/** Sleutel waarmee dubbelen binnen het bestand en tegen bestaande gegevens worden herkend. */
export function duplicateKey(entity: ImportEntity, values: Record<string, string>): string | null {
  if (entity === 'candidates') {
    if (values.email) return `email:${values.email.toLowerCase()}`
    if (values.idNumber) return `id:${values.idNumber.toLowerCase()}`
    return null
  }
  return values.name ? `name:${values.name.toLowerCase()}` : null
}

/** CSV met ; (opent in kolommen in Nederlands Excel), BOM voor accenten. */
export function exampleCsv(entity: ImportEntity): string {
  const fields = IMPORT_FIELDS[entity]
  const cell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const line = (cells: string[]) => cells.map(cell).join(';')
  return ['﻿' + line(fields.map((f) => f.label)), ...IMPORT_EXAMPLES[entity].map((r) => line(fields.map((f) => r[f.key] ?? '')))].join('\r\n')
}
