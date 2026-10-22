/**
 * employment-contract-text.ts
 * WAT:    De volledige tekst van "Arbeidsovereenkomst voor bepaalde tijd" (PGC-HR-F-0513-05, ZIJIN-RGM)
 *         met invulplaatsen, voor de printbare, vooringevulde AO (`/admin/applications/[id]/contract`).
 * WAAROM: Letterlijke kopie van het Word-sjabloon (ook de oorspronkelijke spelling). Dit is juridische
 *         tekst van HR — pas hem alleen aan als het Word-document verandert (zie skill
 *         `pansa-hr-docs-sync`), niet "even herformuleren". Alleen de invulplaatsen komen uit de data;
 *         ontbrekende gegevens blijven stippellijnen zodat ze met de hand ingevuld kunnen worden.
 */

import { addDays, addMonths, differenceInMonths, format, isValid, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

export interface ContractTextVars {
  employeeName: string // "Achternaam, Voornaam"
  birthDate?: string | null // ISO
  birthPlace?: string | null
  idNumber?: string | null
  address?: string | null
  residence?: string | null
  jobTitle?: string | null
  jobLevel?: string | null
  department?: string | null
  startDate?: string | null // ISO
  endDate?: string | null // ISO
  hourlyWageUsd?: string | null
}

export interface ContractArticle {
  heading: string
  /** `li` = onderdeel van een opsomming (a, b, c …) */
  paragraphs: { kind: 'p' | 'li'; text: string }[]
}

export interface ContractDocument {
  employerHeader: string
  title: string
  subtitle: string
  intro: string[]
  articles: ContractArticle[]
  closing: string
  signatures: { employer: string[]; employee: string[] }
}

const DOTS = '…………………'

const NUMBER_WORDS: Record<number, string> = {
  1: 'een', 2: 'twee', 3: 'drie', 4: 'vier', 5: 'vijf', 6: 'zes', 7: 'zeven', 8: 'acht', 9: 'negen', 10: 'tien',
  11: 'elf', 12: 'twaalf', 13: 'dertien', 14: 'veertien', 15: 'vijftien', 16: 'zestien', 17: 'zeventien',
  18: 'achttien', 19: 'negentien', 20: 'twintig', 21: 'eenentwintig', 22: 'tweeëntwintig', 23: 'drieëntwintig',
  24: 'vierentwintig',
}

function orDots(value?: string | null): string {
  return value?.trim() ? value.trim() : DOTS
}

function longDate(iso?: string | null): string {
  if (!iso) return DOTS
  const date = parseISO(iso)
  return isValid(date) ? format(date, 'd MMMM yyyy', { locale: nl }) : DOTS
}

/**
 * Duur in hele maanden tussen start- en einddatum (einddatum inclusief), of `null` als de periode
 * geen heel aantal maanden is / datums ontbreken. In dat geval valt artikel 2 terug op het standaard-
 * sjabloon ("zes (6) maanden").
 */
export function contractDurationMonths(startIso?: string | null, endIso?: string | null): number | null {
  if (!startIso || !endIso) return null
  const start = parseISO(startIso)
  const end = parseISO(endIso)
  if (!isValid(start) || !isValid(end)) return null
  const exclusiveEnd = addDays(end, 1)
  const months = differenceInMonths(exclusiveEnd, start)
  if (months < 1) return null
  return addMonths(start, months).getTime() === exclusiveEnd.getTime() ? months : null
}

export function buildEmploymentContract(v: ContractTextVars): ContractDocument {
  const months = contractDurationMonths(v.startDate, v.endDate)
  const durationText =
    months === null
      ? 'zes (6) maanden'
      : `${NUMBER_WORDS[months] ?? String(months)} (${months}) ${months === 1 ? 'maand' : 'maanden'}`

  const p = (text: string) => ({ kind: 'p' as const, text })
  const li = (text: string) => ({ kind: 'li' as const, text })

  return {
    employerHeader:
      'COMMERCIAL CONTRACTING COMPANY H. PANSA & SONS N.V. · Martin Luther Kingweg km 23, PARA-SURINAME · ' +
      'Phone: (+597)323451 · Email: humanresource@hpsnv.com · Website: www.hpsnv.com · K.K.F. Dossier no.: 30028',
    title: 'ARBEIDSOVEREENKOMST',
    subtitle: 'Voor bepaalde tijd',
    intro: [
      'Ondergetekenden:',
      'Commercial Contracting Company H. Pansa and Sons N.V., ten deze vertegenwoordigd door haar Directeur de heer Pansa Maurino Clemens gevestigd en kantoorhoudende aan de Martin Luther King weg km 23 te Plantage Concordia in het district Para, nader te noemen “de werkgever”',
      'En',
      `${orDots(v.employeeName)}, geboren op ${longDate(v.birthDate)} te ${orDots(v.birthPlace)} met het I.D. no. ${orDots(v.idNumber)} en wonende aan de ${orDots(v.address)} te ${orDots(v.residence)} nader te noemen “ de werknemer”`,
      'Komen als volgt overeen:',
    ],
    articles: [
      {
        heading: 'Artikel 1: Functie en taken van de werknemer',
        paragraphs: [
          p(
            `De werknemer treedt bij de werkgever in dienstbetrekking en wordt tewerkgesteld bij ZIJIN-RGM en verricht werkzaamheden in de functie van ${orDots(v.jobTitle)} level ${orDots(v.jobLevel)} afdeling ${orDots(v.department)}.`
          ),
          p('De werknemer verplicht zich te houden aan alle reglementen van de werkgever en van ZIJIN-RGM.'),
          p(
            'De werknemer verbindt zich zijn werkzaamheden naar beste vermogen te verrichten en zich daarbij te gedragen naar de aanwijzingen, welke hem door of namens de werkgever zullen worden verstrekt.'
          ),
        ],
      },
      {
        heading: 'Artikel 2: Duur en proeftijd',
        paragraphs: [
          p(
            `De arbeidsovereenkomst wordt aangegaan voor de duur van ${durationText}, te rekenen van ${longDate(v.startDate)} en derhalve eindigende op ${longDate(v.endDate)}, met de mogelijkheid tot verlenging. De verlenging dient schriftelijk te geschieden.`
          ),
          p(
            'De proeftijd bedraagt twee (2) maanden, met dien verstande, dat binnen deze proeftijd het ieder der partijen vrijstaat de arbeidsovereenkomst zonder enige opzegging te beëindigen.'
          ),
        ],
      },
      {
        heading: 'Artikel 3: Salaris',
        paragraphs: [
          p(
            `De werknemer treedt bij de werkgever in dienst, en wordt tewerkgesteld bij ZIJIN-RGM, tegen een uurloon van USD ${v.hourlyWageUsd?.trim() ? v.hourlyWageUsd.trim() : '…..'} , conform het vigerende werkrooster van ZIJIN-RGM.`
          ),
          p(
            'Het salaris zal worden berekend tegen de wisselkoers afkomstig van ZIJIN-RGM en wordt betaald in SRD, op de laatste dag van elke maand, na de wettelijk te plegen inhoudingen, middels overmaking op een door de werknemer aan te geven bankrekeningnummer.'
          ),
        ],
      },
      {
        heading: 'Artikel 4: Beëindiging van de Arbeidsovereenkomst',
        paragraphs: [
          p('Beëindiging van deze arbeidsovereenkomst is mogelijk in geval:'),
          li('De werknemer zich niet houdt aan de bepalingen van deze overeenkomst;'),
          li('De werknemer ernstig in gebreke blijft de taken, verantwoordelijkheden en verplichtingen naar behoren uit te voeren;'),
          li('Alle gevallen waar er sprake is van dringende redenen;'),
          li('Een maand na overlijden van de werknemer;'),
          li(
            'Van wederzijdse opzegging (in geval van wederzijdse opzegging van de dienstbetrekking nemen de werkgever en de werknemer minimaal 1 (een) maand in acht), tenzij op grond van de vigerende arbeidswet een langere opzegtermijn in acht moet worden genomen;'
          ),
          li('De lopende projecten/programma’s bij de werkgever zijn beëindigd;'),
          li('Van rechtswege, na verloop van de overeengekomen tijd, zonder dat opzegging vereist is.'),
          p(
            'De werknemer kan overgaan tot vroegtijdige beëindiging van de arbeidsovereenkomst, waarbij een opzegperiode van één (1) maand in acht moet worden genomen.'
          ),
        ],
      },
      {
        heading: 'Artikel 5: Werktijden',
        paragraphs: [
          p('De werkdagen zijn van maandag tot en met vrijdag van 08.00 tot 16.00 uur.'),
          p(
            'De werknemer is op verzoek van de werkgever verplicht, buiten de vastgestelde werktijd overwerk te verrichten, tegen een beloning van 150%, op zondag 200%, op feestdagen 300%.'
          ),
        ],
      },
      {
        heading: 'Artikel 6: Vakantieverlof en - uitkering',
        paragraphs: [
          p(
            'De werknemer heeft recht op een aantal vakantie (verlof) dagen voor de duur van het dienstverband, conform de vakantiewet. Dit dient te worden opgenomen in overleg met de werkgever. Gedurende de vakantie wordt het salaris van de werknemer doorbetaald.'
          ),
          p(
            'De werknemer heeft gedurende het dienstverband recht op een vakantie-uitkering, van aantal vakantie (verlof) dagen gedeeld door 2, vermenigvuldigd met het uurloon.'
          ),
        ],
      },
      {
        heading: 'Artikel 7: Persoonlijke Beveiliging Attributen (PBA)',
        paragraphs: [
          p(
            'De werknemer is verplicht zorgvuldig en zuinig om te gaan met persoonlijke beveiliging attributen (PBA), afhankelijk van het soort materiaal of type werk wordt bepaald als er met of zonder betaling PBA per jaar verstrekt wordt.'
          ),
        ],
      },
      {
        heading: 'Artikel 8: Medische voorzieningen en verzekeringen',
        paragraphs: [
          p(
            'De werkgever verplicht zich tot het aangaan van alle wettelijk verplichte verzekeringen ten behoeve van de bescherming van de werknemer, conform de Wet Nationale Basiszorgverkering en de Surinaamse Ongevallen Regeling:'
          ),
          li('De werknemer heeft recht op de bij de werkgever geldende medische ziektekostenregeling zoals bepaald in het Personeelsgids.'),
          li(
            'De werkgever verplicht zich conform de Surinaamse Ongevallen Regeling tot het bijdragen in de dekking van de kosten van de voor de werknemer gesloten Persoonlijke Ongevallenverzekering.'
          ),
        ],
      },
      {
        heading: 'Artikel 9: Pensioen',
        paragraphs: [p('De werknemer neemt deel in de pensioenregeling conform de wet Algemeen Pensioen.')],
      },
      {
        heading: 'Artikel 10: Medische keuring',
        paragraphs: [
          p(
            'De werknemer is gehouden, indien de werkgever zulks noodzakelijk acht, zich te onderwerpen aan een medisch onderzoek, door een aan te wijzen arts door de werkgever. De kosten voor dit medisch onderzoek zijn voor rekening van de werknemer, terwijl het dienstverband gedurende voormelde procedure voortduurt.'
          ),
        ],
      },
      {
        heading: 'Artikel 11: Drugs en Alcohol test',
        paragraphs: [
          p(
            'De werknemer is verplicht gedurende het dienstverband – zodra en indien dit door de werkgever noodzakelijk wordt geacht – mee te werken aan een drugs – en/ of alcoholtest.'
          ),
          p(
            'Indien de werknemer weigert mee te werken aan een drugs- en/of alcohol test, zoals aangegeven in het voorgaande lid, levert deze weigering een dringende reden voor ontslag op, in de zin van artikel 1615o en 1615p van het Surinaams Burgerlijk Wetboek.'
          ),
        ],
      },
      {
        heading: 'Artikel 12: Non-Concurrentiebeding',
        paragraphs: [
          p(
            'Het is de werknemer verboden binnen een tijdvak van 3 (drie) jaren na beëindiging van de dienstbetrekking, zelf binnen een gebied met een straal van 40 km in enigerlei vorm een zaak, gelijk, gelijksoortig of aanverwant aan die van de werkgever te vestigen, te drijven, mede te drijven of te doen drijven, hetzij direct, hetzij indirect, alsook financieel in welke vorm ook bij een dergelijke zaak belang te hebben, direct of indirect, of daarin of daarvoor op enigerlei wijze werkzaam te zijn, hetzij tegen vergoeding, hetzij om niet, of daarin aandeel van welke aard ook te hebben.'
          ),
          p(
            'Bij overtreding van het in lid 1 omschreven verbod verbeurt de werknemer ten behoeve van de werkgever een dadelijk opvorderbare boete van SRD. 20,000. -- (Twintigduizend Surinaamse Dollars) voor elke dag, dat de werknemer in overtreding is.'
          ),
        ],
      },
      {
        heading: 'Artikel 13: Geheimhoudingsbeding',
        paragraphs: [
          p(
            'De werknemer erkent, dat hem door de werkgever geheimhouding is opgelegd van alle bijzonderheden de werkgever zijn onderneming betreffende of daarmee verband houdende.'
          ),
          p(
            'Het is de werknemer verboden, hetzij gedurende de dienstbetrekking, hetzij na beëindiging hiervan, op enigerlei wijze aan derden direct of indirect, in welke vorm ook en in welke voege ook, enige mededeling te doen van of aangaande enige bijzonderheden de onderneming van de werkgever betreffende of daarmede verband houdende, op straffe van verbeurte aan de werkgever van een dadelijk ineens zonder sommatie of in gebrekestelling opeisbare boete groot SRD. 35,000. -- (Vijfendertigduizend Surinaamse Dollars), onverminderd zijn gehoudenheid tot betaling aan de werkgever van een volledige schadevergoeding te dezer zake, indien deze meer dan gemeld boetebedrag mocht belopen.'
          ),
          p(
            'Overtreding van lid 2 van dit artikel zal voor de werkgever een dringende reden opleveren tot ontslag op staande voet als bedoeld in artikel 1615p lid 9 van het Surinaams Burgerlijk Wetboek en zal hem aanleiding kunnen geven bij de politie aangifte te doen van het plegen van het misdrijf omschreven in art. 333 lid 1 van het Wetboek van Strafrecht.'
          ),
        ],
      },
      {
        heading: 'Artikel 14: Nevenfuncties',
        paragraphs: [
          p(
            'De werknemer verbindt zich gedurende de loop der dienstbetrekking bij geen andere werkgever of opdrachtgever werkzaam te zullen zijn, noch direct, noch indirect en zich te zullen onthouden van het doen van zaken voor eigen rekening.'
          ),
        ],
      },
      {
        heading: 'Artikel 15: Arbeidsongeschiktheid',
        paragraphs: [
          p(
            'De werknemer is gehouden om bij ongeschiktheid tot het verrichten van zijn werkzaamheden, de werkgever per ommegaande hiervan in kennis te stellen. Bij ziekte zal de werknemer een medische verklaring van de arts/ doktersattest moeten overleggen.'
          ),
        ],
      },
      {
        heading: 'Artikel 16: Her- en bijscholing',
        paragraphs: [
          p(
            'De werknemer is op verzoek van de werkgever verplicht om periodiek, ook buiten de reguliere werktijden her- en bijscholingscursussen te volgen, waarvan de kosten voor rekening van de werkgever komen.'
          ),
          p(
            'De werknemer verplicht c.q. verbindt zich om de cursus (sen) in zijn geheel te volgen en af te ronden en om na het afronden van genoemde cursus (sen), het bedrijf, voor de duur van het contract, evenals bij een eventuele verlenging, te dienen, hetzij middels het toepassen van de opgedane kennis, hetzij middels het opleiden c.q. overdragen van de opgedane kennis aan andere werknemers.'
          ),
          p(
            'Het tijdens deze opleiding verstrekte studie- en documentatiemateriaal blijft het eigendom van de werkgever, evenals de aan de werknemer verstrekte certificaten in het bezit van de werkgever zullen blijven. Dat bij voortijdige beëindiging, voormelde certificaten en documentatiemateriaal, slechts aan de werknemer afgestaan kunnen worden, indien hij de totale trainingskosten aan de werkgever terugbetaalt.'
          ),
          p(
            'De kosten gemaakt door de werkgever in het belang van de werknemer, bij het in dienst treden (o.a. kosten voor medische keuring, administratie kosten, kosten voor veiligheidsbeschutting etc.), zullen voor rekening komen van werknemer, indien de dienstbetrekking korter dan 04 maanden duurt. Zulks zal plaatsvinden door verrekening met het salaris van betrokken werknemer.'
          ),
          p(
            'Indien de werknemer zich niet houdt aan hetgeen hierbij is overeengekomen, en de dienstbetrekking op grond van artikel 1615o wordt beëindigd, zal hij schadeplichtig zijn, hetgeen inhoudt de onvoorwaardelijke terugbetaling van de totale kosten verbonden aan de gevolgde cursussen.'
          ),
          p('Tevens zal de werkgever ook recht hebben op vergoeding van de wettelijke rente over de totale trainingskosten.'),
          p(
            'Vanwege de grote verantwoordelijkheid van de werknemer naar de werkgever toe, die ook blijkt uit zijn taakomschrijving, zal hij elke handeling nalaten, die erop gericht is dan wel gekwalificeerd kan worden als een weigering om werkzaamheden conform deze overeenkomst, uit te voeren, waardoor schade wordt toegebracht aan de werkgever, op straffe van ontslag conform de bepalingen opgenomen in het Surinaams Burgerlijk Wetboek.'
          ),
        ],
      },
      {
        heading: 'Artikel 17: Andere bepalingen',
        paragraphs: [
          p(
            'De werknemer houdt zich bij de uitoefening van diens werkzaamheden aan de bepalingen van de HPS personeelsgids & RGM gedragscode. Bij de ondertekening van deze overeenkomst ontvangt de werknemer een exemplaar van de HPS personeelsgids & RGM gedragscode, welke integraal deel uitmaakt van deze arbeidsovereenkomst. De werknemer zal voor ontvangst tekenen.'
          ),
        ],
      },
      {
        heading: 'Artikel 18: Toepasselijk recht',
        paragraphs: [p('Op deze overeenkomst is het Surinaams recht van toepassing.')],
      },
    ],
    closing: 'Aldus overeengekomen en in tweevoud opgemaakt en getekend in het district Para de dato ……………………………',
    signatures: {
      employer: ['De werkgever,', 'De heer Pansa Maurino MBA', 'Directeur CCC H. Pansa and Sons N.V.'],
      employee: ['De werknemer,', `De heer/Mevrouw ${orDots(v.employeeName)}`],
    },
  }
}
