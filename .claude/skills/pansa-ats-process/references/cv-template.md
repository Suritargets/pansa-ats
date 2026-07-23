# Curriculum Vitae — sjabloon

**Bedrijf:** Commercial Contracting Company H. Pansa & Sons N.V. · K.K.F. Dossier no. 30028

Bronbestand: `docs/process/word/3. Curriculum Vitae hps 2026.docx`

Gestandaardiseerd CV-sjabloon, ingevuld door of namens de kandidaat.

## Personal information / persoonsgegevens

- Last name / familienaam, first names / voornamen
- Job title, project, department
- ID number, gender/geslacht, date of birth/geboortedatum, birth place/geboorteplaats
- Address/adres, residence/woonplaats, district
- Nationality/nationaliteit
- Category driving license / categorie rijbewijs
- Date police clearance / datum bewijs van goed gedrag
- **Familielid werkzaam bij Pansa Group/HPS**: ja/nee — indien ja: relatie met familielid,
  naam familielid (belangenverstrengeling-check bij aanname)

## Education and training / opleiding en training

Tabel: opleidingsniveau, schooltype, studierichting.

## Professional experience / werkervaring

Tabel: werkperiode, bedrijfsnaam, functie, werkzaamheden.

## Personal competencies / persoonlijke competenties

Vrije tekst.

## Language skills / taalvaardigheid

Vrije tekst.

## Ondertekening

Handtekening HR + handtekening werknemer, plaats/datum ("Aldus naar waarheid ingevuld").

## Relevantie voor het datamodel

Het "familielid werkzaam bij Pansa Group/HPS"-veld is een belangenverstrengelings-check die
nergens anders in het proces terugkomt — het datamodel heeft hier momenteel geen apart veld
voor; overweeg dit toe te voegen aan `candidates` of `emergency_contacts` als hier in de
praktijk behoefte aan blijkt (bv. `relatedToStaffMember: boolean` + toelichting).
