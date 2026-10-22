# Vragenlijst Antecedentenonderzoek (referentiecheck)

**Documentcode:** PGC-HR-F-0507-04 · **Datum:** 5 januari 2026

Bronbestand: `hr new/4. Vragenlijst antecedentenonderzoek 2026.docx`

Selectiestap "Antecedentenonderzoek verrichten": de HR-medewerker belt de **referentie die de
sollicitant opgaf** (vorige werkgever/supervisor) en stelt deze vragen. In het datamodel: tabel
`reference_checks` (een sollicitatie kan meerdere referenties hebben).

## Gegevens van de gebelde referent

- Naam
- Functie
- Bedrijf
- Adres
- Telefoonnummer

(Voorinvullen uit `candidates.last_supervisor_name` / `last_supervisor_contact` en de laatste
werkgever uit `work_history`.)

## Vragen — "de heer/mevrouw (X)" is de sollicitant

1. Hoelang was (X) in dienst binnen uw organisatie?
2. Met welke reden heeft (X) uw organisatie verlaten?
3. Bij welke afdeling heeft (X) gewerkt binnen uw organisatie?
4. Welke functie(s) heeft (X) bekleed binnen uw organisatie?
5. Kunt u (X) beschrijven in **één woord**? En waarom speciaal dat woord?
6. Kunt u mij wat vertellen over de **werkattitude** van (X)?
7. Zou u (X) **weer in dienst willen nemen**? (ja/nee — de enige gesloten vraag)

Het formulier heeft geen scores en geen handtekeningregel; het is puur een
gespreksverslag. Wel hoort het in het personeelsdossier (index-onderdeel 4).

## Vertaling naar de ATS

`reference_checks`: `application_id`, referentiegegevens (naam/functie/bedrijf/adres/telefoon),
`employment_duration`, `reason_for_leaving`, `department`, `positions_held`, `one_word`,
`one_word_reason`, `work_attitude`, `would_rehire` (boolean), `notes`, `checked_by`, `checked_at`.
