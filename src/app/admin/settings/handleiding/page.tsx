/**
 * admin/settings/handleiding/page.tsx
 * WAT:    Ingebouwde handleiding voor het hele systeem — per module uitgeklapt te lezen.
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'

interface Section {
  title: string
  body: { heading: string; text: string }[]
}

const SECTIONS: Section[] = [
  {
    title: 'Dashboard & Rapportages',
    body: [
      {
        heading: 'Dashboard',
        text: 'KPI-overzicht: aantal sollicitaties per status, actief geplaatste kandidaten, aantal clienten/kandidaten en openstaande vacature-aanvragen. Onder "Aandachtspunten" staan de contracten die aflopen, RGM-badges die vervallen en proeftijdevaluaties (week 4/8) die aan de beurt zijn.',
      },
      {
        heading: 'Rapportages',
        text: 'Conversie-funnel (hoeveel sollicitaties elke fase bereikten) en gemiddelde doorlooptijd per fase, berekend uit de statusgeschiedenis van elke sollicitatie.',
      },
    ],
  },
  {
    title: 'CRM — Kandidaten, Clienten, Leverancier/Relatie',
    body: [
      {
        heading: 'Kandidaten',
        text: 'Alle kandidaten, filterbaar op branche/niveau/functie en doorzoekbaar op naam (zoekbalk boven de tabel). "Importeren" laat je een CSV bulk uploaden — je krijgt eerst een preview te zien voordat er iets wordt opgeslagen.',
      },
      {
        heading: 'Clienten',
        text: 'De bedrijven die personeel bij Pansa afnemen (niet te verwarren met de Pansa-dochterbedrijven zelf, die zitten achter "companyId" op elke sollicitatie). Status prospect/active/inactive.',
      },
      {
        heading: 'Leverancier/Relatie',
        text: 'Externe partijen: medische keuring, uitzendbureaus, verzekeraars, trainingsinstituten, overheid, overig.',
      },
    ],
  },
  {
    title: 'Werving & Selectie',
    body: [
      {
        heading: 'Sollicitaties',
        text: 'De volledige pipeline, filterbaar op status en doorzoekbaar op kandidaatnaam/functie. Klik een rij open voor het volledige profiel: tabs Profiel, Interviews, Antecedenten, Onboarding, Contract, Dossier, Documenten. Vanuit Profiel kun je ook de CV bekijken/printen en het profiel delen met een client.',
      },
      {
        heading: 'Antecedentenonderzoek',
        text: 'Tab Antecedenten: bel de referent uit de sollicitatie en leg de antwoorden vast volgens de Vragenlijst antecedentenonderzoek (PGC-HR-F-0507-04). De referent wordt voorgevuld uit de laatste supervisor/werkgever. Per sollicitatie kunnen meerdere referenties worden vastgelegd.',
      },
      {
        heading: 'WhatsApp-berichten',
        text: 'Rechts op de sollicitatie staan zes knoppen voor de contactmomenten uit het proces (stukken aanleveren, uitnodiging gesprek, medische keuring, client start-/inductiedatum, interne inductie, PPE ophalen). De knop opent WhatsApp met een voorgevuld bericht; vul de [haakjes] aan voordat je verstuurt. Er wordt niets automatisch verzonden.',
      },
      {
        heading: 'Registratienummer & Community of Interest',
        text: 'Elke kandidaat krijgt automatisch een registratienummer (REG-#####). Bij het digitaliseren van een papieren formulier kun je het nummer van het formulier overnemen. De vier Community-of-Interest-vragen (district Brokopondo / Klein Saramacca, voor RGM) staan in het sollicitatieformulier en het kandidaatpaneel, en komen op het CV en in de algemene export.',
      },
      {
        heading: 'Digitaliseren',
        text: 'Voor papieren/gescande registratieformulieren. Upload een foto of PDF, AI leest de velden uit (altijd controleren voordat je opslaat — niets wordt automatisch geaccepteerd). Er is een "Eén document"-modus en een "Meerdere documenten (bulk)"-modus die meerdere scans of links achter elkaar verwerkt, waarna je ze één voor één doorloopt en goedkeurt.',
      },
    ],
  },
  {
    title: 'Clientzone',
    body: [
      {
        heading: 'Vacature-aanvragen',
        text: 'Aanvragen van clienten (via het klantportaal of het publieke aanvraagformulier). Keur goed/af of markeer als vervuld. Functie-eisen per categorie staan uitgeklapt onder elke rij.',
      },
      {
        heading: 'Gedeelde profielen',
        text: 'Overzicht van welke kandidaatprofielen met welke client gedeeld zijn, inclusief eventuele feedback van de client.',
      },
    ],
  },
  {
    title: 'Onboarding & Training',
    body: [
      {
        heading: 'Onboarding',
        text: 'Checklist per sollicitatie volgens de aanstellingsprocedure (beleid, basisgegevens, contract, personeelsdossier, medische verzekering, client pre-employment, HR-/OHSEQ-/afdelings-/client-inductie, PPE, begeleiding, proeftijdevaluaties), aan te vinken op de detailpagina van de sollicitatie.',
      },
      {
        heading: 'Dossier',
        text: 'Tab Dossier op de sollicitatie: de Index Personeelsdossier (PGC-HR-F-0508-04) met 11 onderdelen en status/datum per onderdeel, plus het client pre-employment pakket (medical certificate, SOR, valid police clearance, valid identification). Ontbrekende stukken upload je direct onder de lijst. "Index afdrukken" geeft het papieren formulier.',
      },
      {
        heading: 'Contracten & badges',
        text: 'Overzicht van alle lopende arbeidsovereenkomsten met einddatum, RGM-badge-vervaldatum en de proeftijdevaluaties op week 4 en 8, met waarschuwingen binnen 30 dagen. Op het tabblad Contract van een sollicitatie leg je stadia vast, wijzig je de status (actief/beëindigd/ontbonden), vul je de proeftijdbeoordelingen in en druk je de vooringevulde arbeidsovereenkomst (PGC-HR-F-0513-05) af. Controleer artikel 2 voor stadia na de eerste proeftijd.',
      },
      {
        heading: 'Trainingen',
        text: 'Cataloguus van trainingen die aan kandidaten toegekend kunnen worden.',
      },
    ],
  },
  {
    title: 'Export',
    body: [
      { heading: 'Payroll export', text: 'Batches voor de loonadministratie, per batch als CSV te downloaden.' },
      { heading: 'Algemene export', text: 'Alle sollicitaties/kandidaten in één keer als CSV, zonder batch-opslag.' },
    ],
  },
  {
    title: 'Integraties',
    body: [
      {
        heading: 'Formulier embedden',
        text: 'Kant-en-klare HTML-snippet om het sollicitatieformulier of het personeel-aanvraagformulier op een andere website te plaatsen (bv. de Pansa-marketingsite). Eén script (embed.js) ondersteunt alle embeds.',
      },
      {
        heading: 'API-sleutels',
        text: 'Voor externe systemen die met de Pansa ATS willen praten via /api/v1. Sleutels zijn scope-gebonden (lezen/schrijven van sollicitaties) en worden maar één keer getoond bij aanmaak — bewaar ze meteen.',
      },
      {
        heading: 'Webhooks',
        text: 'Stuurt automatisch een ondertekend (HMAC-SHA256) bericht naar een extern systeem zodra een sollicitatie binnenkomt, een status wijzigt, of een vacature-aanvraag binnenkomt.',
      },
    ],
  },
  {
    title: 'Instellingen (alleen super_admin)',
    body: [
      { heading: 'Functiecategorieën', text: 'De 35 functies uit het registratieformulier, elk gekoppeld aan een branche en niveau.' },
      { heading: 'Interviewvragen', text: 'Beheerbare vragenlijst voor het algemene (gescoorde) en het werkervaring-interview.' },
      { heading: 'Gebruikers & rollen', text: 'Staff- en client-accounts aanmaken, rol wijzigen, activeren/deactiveren. Je kunt je eigen account niet deactiveren of van rol wijzigen.' },
      { heading: 'Audit-log', text: 'Alle belangrijke gebeurtenissen (inloggen, statuswijzigingen, delen, gebruikersbeheer) — filterbaar op action.' },
    ],
  },
  {
    title: 'Sneltoetsen & navigatie',
    body: [
      {
        heading: 'Omni-search',
        text: 'Ctrl+K (of klik de zoekbalk bovenaan) opent een zoekvenster waarmee je direct naar een instellingenpagina navigeert, of een kandidaat/client/sollicitatie op naam opzoekt.',
      },
      {
        heading: 'Sidebar-groepen',
        text: 'Klik op een groepstitel (bv. "CRM") om die groep in te klappen — handig als de sidebar te vol aanvoelt. De groep met de actieve pagina klapt automatisch open.',
      },
    ],
  },
  {
    title: 'Portalen',
    body: [
      { heading: 'Klantportaal (/client)', text: 'Clienten zien alleen de met hen gedeelde profielen, kunnen feedback geven en vacatures aanvragen.' },
      { heading: 'Kandidaatportaal (/candidate)', text: 'Kandidaten zien hun eigen sollicitatiestatus met een visuele voortgangsindicator.' },
    ],
  },
]

export default async function HandleidingPage() {
  const session = await requireSession([...STAFF_ROLES])

  return (
    <AdminShell session={session}>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Handleiding</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Korte uitleg per onderdeel van het systeem. Klik een sectie open.
      </p>

      <div className="max-w-3xl space-y-2">
        {SECTIONS.map((section) => (
          <details key={section.title} className="group rounded-xl border border-border bg-card open:pb-2">
            <summary className="cursor-pointer list-none px-4 py-3 font-heading text-base font-semibold text-foreground marker:content-none">
              <span className="inline-block w-4 text-muted-foreground transition-transform group-open:rotate-90">›</span>{' '}
              {section.title}
            </summary>
            <div className="space-y-3 px-4 pb-1">
              {section.body.map((item) => (
                <div key={item.heading}>
                  <p className="text-sm font-medium text-foreground">{item.heading}</p>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </AdminShell>
  )
}
