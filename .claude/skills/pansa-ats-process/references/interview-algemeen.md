# Vragenlijst Sollicitatiegesprek (algemeen, gescoord)

**Documentcode:** PGC-HR-F-0504-04 · **Datum:** 5 januari 2026

Bronbestand: `docs/process/word/4. Vragenlijst sollicitatiegesprek hps 2026.docx`

Het algemene sollicitatiegesprek — het eerste interview in de selectieprocedure, met een
scoresysteem. In het datamodel: `interviews.type = 'general'`,
`interviews.totalScore` / `averageScore`.

## Kopregel

Naam sollicitant, datum, tijd, handtekening.

## De 15 vragen

1. Vertel iets over jezelf
2. Wat weet je over onze organisatie?
3. Welke werkzaamheden spreken jou aan?
4. Wat zijn jouw sterke punten?
5. Wat zijn jouw verbeterpunten?
6. Waar zie je jezelf over 1 jaar of 5 jaar, qua jouw werkzaamheden?
7. Ben je proactief, creatief, innovatief en flexibel? Geef een voorbeeld binnen jouw
   vakgebied/studierichting/specialisatie
8. Waarom zouden we juist jou moeten aannemen, binnen jouw vakgebied/studierichting/specialisatie?
9. Met welke softwareprogramma's kan je werken? Geef voorbeelden
10. Heb je ooit gewerkt volgens standaarden en richtlijnen? Kan je met werkprocessen,
    procedures en formulieren werken?
11. Kan je in teamverband werken? Noem een voorbeeld
12. Hoe ga je om met vastgestelde deadlines? Heb je bezwaren tegen onregelmatige werkuren?
13. Ben je een goed georganiseerd persoon? Geef voorbeelden
14. Ben je multi-inzetbaar? Welke werkzaamheden kan je nog meer uitvoeren buiten jouw
    vakgebied/studierichting/specialisatie?
15. Welke bijdrage kan je leveren aan dit bedrijf met jouw kennis, vaardigheden,
    werkattitudes (competenties en werkervaring)?

## Scoring

Elke vraag krijgt een score; het formulier registreert een **totale score** en een
**gemiddelde score**. In `InterviewForm.tsx` wordt elke vraag 1-5 gescoord en worden
`totalScore`/`averageScore` automatisch berekend uit de ingevulde scores.

## Afsluiting

HR-management: datum, tijd, handtekening.
