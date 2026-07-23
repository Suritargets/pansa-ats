# Basisgegevens Nieuwe Medewerker

**Bedrijf:** Commercial Contracting Company H. Pansa & Sons N.V. · K.K.F. Dossier no. 30028

Bronbestand: `docs/process/word/9. Basisgegevens nieuwe medewerker hps RGM 2026.docx`

Het intakeformulier voor de aanstellingsprocedure (na aanname) — de brug tussen
"kandidaat" en "medewerker". In het datamodel: velden op `employment_contracts` en
`emergency_contacts`.

## Basisgegevens

- Familienaam, voornamen
- Functie, project/locatie, department
- Badgenummer
- Girorekeningnummer, bankinstelling
- Uurloon
- Datum van indiensttreding
- ID-nummer, geslacht, geboortedatum, geboorteplaats
- Adres, woonplaats, district
- Telefoonnummer/mobielnummer, e-mailadres
- Huisarts
- Afkomstig van het dorp (naam) + traditioneel gezag van het dorp (titel & naam)

## Contactpersonen in geval van calamiteiten/ongevallen

Tot 3 contactpersonen, elk met: naam, voornaam, relatie tot de werknemer,
telefoonnummer(s), adres, woonplaats. → `emergency_contacts` (veld `priority` 1-3).

## HR-introductieonderwerpen (checklist)

- Pansa Group/HPS personeelsgids (rechten en plichten werkgever en werknemer)
- RGM Code of Conduct
- OHSEQ-procedures
- Medische verzekering (basiszorgverzekering)
- Vertegenwoordiging on site (wekelijks een HR-vertegenwoordiger on site)
- Meldingspunt Pansa Group Head Office (HR-mobiel + kantoornummer)
- Contract — arbeidsovereenkomst
- Ziektemelding (attest binnen 1 dag indienen, kantoor of on site)
- Verlofaanvragen (**12 dagen/jaar**, elk jaar 2 dagen extra tot max. **18 dagen**)
- Vakantietoelage (proces uitleggen volgens de vakantiewet)
- Betaalschema

Deze checklist is de bron voor de globale `onboarding_step_templates` die bij het zaaien
van de database zijn aangemaakt (zie `drizzle/seed.ts`).

## Afsluiting

HR-handtekening + werknemershandtekening, plaats/datum ("Aldus naar waarheid ingevuld").
