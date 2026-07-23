# Vragenlijst Job Interview — Work Experience

**Documentcode:** PGC-HR-F-0520-01 · **Datum:** 5 januari 2026

Bronbestand: `docs/process/word/20. Vragenlijst job interview hps 2026.docx`

Het technische/werkervaring-interview — één van de twee interviewtypes in de
selectieprocedure (naast het algemene sollicitatiegesprek). In het datamodel:
`interviews.type = 'work_experience'`.

## Kopregel

- Naam en voornaam kandidaat, datum, tijd, mobielnummer
- Referentie vorige werkgever + mobielnummer referentie
- Bewijsmateriaal: getuigschrift, badge, awards, certificaten, diploma's

## De 12 categorieën (open vragen, geen score)

1. **Overzicht van de kerntaken** — Wat zijn/waren uw dagelijkse werkzaamheden?
2. **Veiligheid controleren** — Welke voorbereidingswerkzaamheden heeft u uitgevoerd binnen uw job/functie?
3. **Technische vakkennis**
   - Welke specifieke technische werkzaamheden heeft u uitgevoerd binnen uw job/functie?
   - Welke specifieke producten heeft u gemaakt binnen uw vakgebied?
   - Welke opdrachten of instructies heeft u gekregen binnen uw vakgebied?
4. **Materialenkennis** — met welke specifieke materialen heeft u gewerkt?
5. **Gereedschappenkennis** — met welke specifieke gereedschappen heeft u gewerkt?
6. **Kennis van machines** — met welke specifieke machines heeft u gewerkt?
7. **Kennis van tekenen** — kunt u een technische tekening maken? Kunt u er een lezen en begrijpen?
8. **Kennis van softwareprogramma's** — met welke softwareprogramma's heeft u gewerkt?
9. **Kennis van ISO-standaarden** — met welke werkprocessen, procedures en formulieren heeft u gewerkt?
10. **Housekeeping** — welke werkzaamheden heeft u uitgevoerd aan het eind van uw job/shift?
11. **Werkattitude** — welke werkattitudes passen bij u?
12. **Taal** — welke talen kunt u spreken / begrijpen / lezen / schrijven?

## Afsluiting

HR-management: datum, tijd, handtekening.

## Datamodel-mapping

`interviews.questions` (jsonb) slaat elke categorie op als
`{ category, answer }` (geen `score`-veld voor dit type — score is voorbehouden aan het
algemene gesprek, zie `interview-algemeen.md`).
