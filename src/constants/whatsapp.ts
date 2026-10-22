/**
 * whatsapp.ts
 * WAT:    Berichtsjablonen + link-bouw voor de WhatsApp-contactmomenten uit het
 *         Werving-, selectie- en introductieproces (PGC-HR-PR-0501-05, versie 30-09-2026).
 * WAAROM: Sinds die versie loopt het contact met sollicitanten via WhatsApp (de wekelijkse sms is
 *         vervallen). Het proces noemt zes momenten, maar geeft géén berichttekst — de teksten
 *         hieronder zijn voorstellen die HR in WhatsApp nog kan aanpassen voor verzenden. Er wordt
 *         niets automatisch verstuurd: de knop opent alleen een voorgevuld bericht.
 */

export interface WhatsAppContext {
  firstName: string
  companyName: string
  positionApplied: string
}

export interface WhatsAppTemplate {
  id: string
  label: string
  /** Fase van het proces waar dit contactmoment bij hoort. */
  phase: 'Werving' | 'Selectie' | 'Aanstelling'
  build: (ctx: WhatsAppContext) => string
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'documents',
    label: 'Stukken aanleveren',
    phase: 'Werving',
    build: ({ firstName, companyName, positionApplied }) =>
      `Beste ${firstName}, bedankt voor je sollicitatie als ${positionApplied} bij ${companyName}. ` +
      `Wil je de volgende stukken aanleveren: geldig bewijs van goed gedrag, kopie ID-kaart, kopie rijbewijs ` +
      `(indien van toepassing), diploma's/cijferlijsten, certificaten, pasfoto, uittreksel/kopie familieboek en ` +
      `een referentiebrief van je vorige werkgever. Neem de originele stukken mee voor verificatie.`,
  },
  {
    id: 'interview',
    label: 'Uitnodiging gesprek / client interview',
    phase: 'Selectie',
    build: ({ firstName, companyName, positionApplied }) =>
      `Beste ${firstName}, je bent geselecteerd voor een gesprek voor de functie ${positionApplied} bij ${companyName}. ` +
      `Datum: [datum], tijd: [tijd], locatie: [locatie/online-link]. Neem je ID-kaart en de originele stukken mee. ` +
      `Wil je bevestigen dat je aanwezig kunt zijn?`,
  },
  {
    id: 'medical',
    label: 'Medische keuring',
    phase: 'Selectie',
    build: ({ firstName }) =>
      `Beste ${firstName}, voor je indiensttreding is een medische keuring nodig. ` +
      `Datum: [datum], tijd: [tijd], locatie: [locatie]. Neem je ID-kaart mee. ` +
      `Wil je bevestigen dat je kunt komen?`,
  },
  {
    id: 'client-start',
    label: 'Client start- en inductiedatum',
    phase: 'Selectie',
    build: ({ firstName, positionApplied }) =>
      `Beste ${firstName}, de start- en inductiedatum bij de client voor je functie ${positionApplied} is ` +
      `[startdatum] (inductie: [inductiedatum]). Wil je bevestigen dat deze data voor jou passen?`,
  },
  {
    id: 'internal-induction',
    label: 'PGC interne inductie',
    phase: 'Aanstelling',
    build: ({ firstName, companyName }) =>
      `Beste ${firstName}, welkom bij ${companyName}. Je interne inductie is op [maandag/woensdag/vrijdag] ` +
      `[datum] om [tijd] op het hoofdkantoor (Martin Luther Kingweg km 23). Neem je ID-kaart en bankgegevens mee.`,
  },
  {
    id: 'ppe',
    label: 'PPE ophalen',
    phase: 'Aanstelling',
    build: ({ firstName }) =>
      `Beste ${firstName}, je PPE ligt klaar om op te halen. Je kunt het ophalen op [datum] tussen [tijd]. ` +
      `Je tekent bij ontvangst het PPE-afgifteformulier.`,
  },
]

/**
 * Zet een telefoonnummer om naar het internationale cijferformaat dat wa.me verwacht.
 * Surinaamse nummers zijn lokaal 7 cijfers (landcode 597). Alles wat we niet zeker kunnen
 * omzetten geeft `null` — liever geen knop dan een bericht naar een verkeerd nummer.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 7) return `597${digits}`
  if (digits.length === 10 && digits.startsWith('597')) return digits
  if (digits.length >= 10 && digits.length <= 15) return digits
  return null
}

export function whatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
