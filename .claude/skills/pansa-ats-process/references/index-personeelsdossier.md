# Index Personeelsdossier

**Documentcode:** PGC-HR-F-0508-04 · **Datum:** 30 september 2026

Bronbestand: `hr new/01. INDEX PERSONEELSDOSSIER.docx`

Inhoudsopgave/checklist van het papieren personeelsdossier van één medewerker, met een
**datum**-kolom per onderdeel (wanneer het stuk in het dossier kwam). Het procesdocument eist
dat de index **wekelijks** wordt bijgehouden.

## De 11 onderdelen

| # | Onderdeel | Bron in de ATS |
|---|---|---|
| 1 | Registratieformulier — met subregels: Goedgedrag · Kopie ID-kaart · Kopie rijbewijs · Kopie diploma's en cijferlijsten · Kopie training certificaten · Pasfoto, uittreksel, kopie familieboek | Kandidaatrecord + documenten (`police_clearance`, `id_document`, `drivers_license`, `diploma`, `certificate`, `photo_family_docs`) |
| 2 | Vragenlijst sollicitatiegesprek | `interviews.type = 'general'` |
| 3 | Vragenlijst job interview | `interviews.type = 'work_experience'` |
| 4 | Vragenlijst antecedentenonderzoek | `reference_checks` |
| 5 | Curriculum vitae formulier | CV is altijd te genereren (`/admin/applications/[id]/cv`); document `cv` als geüpload |
| 6 | Inductie formulier | onboarding-stappen HR-/OHSEQ-/Afdelings-/Client-inductie |
| 7 | Basisgegevens nieuwe werknemer | contract (badge/uurloon/bank) + `emergency_contacts` |
| 8 | Arbeidsovereenkomst | `employment_contracts` / document `signed_contract` |
| 9 | Medische keuring certificaat | document `medical_certificate` |
| 10 | SOR verzekering verklaring | document `sor_declaration` |
| 11 | Aanvraag Medische verzekering | document `medical_insurance` |

Onder punt 11 staan lege regels voor aanvullende stukken.

## Vertaling naar de ATS

- Tab **Dossier** op de sollicitatie toont deze 11 onderdelen (+ subregels van 1) met status
  (aanwezig/ontbreekt) en datum, berekend uit bestaande data — er is geen aparte tabel.
- Printpagina `/admin/applications/[id]/dossier` geeft het formulier terug zoals het papieren
  origineel (nummering 1–11, kolom DATUM).
- Daaronder de vier **client pre-employment**-stukken (medical certificate, SOR, valid police
  clearance, valid identification) — dezelfde bron, andere samenstelling.
