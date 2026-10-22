# Induction Sheet

**Documentcode:** PGC-HR-F-0506-04 · **Datum:** 5 januari 2026

Bronbestand: `hr new/6. Induction form hps 2026.docx`

Het inductieformulier dat de nieuwe medewerker laat afvinken per inductieonderdeel. Eén tabel
met vier rijen; elke rij wordt ondertekend door de **begeleider (contributor)** en de
**medewerker**, met datum.

| Subject | Contributor (naam + handtekening) | Employee | Date |
|---|---|---|---|
| HR-Induction | | | |
| OHSEQ Induction | | | |
| Department Induction | | | |
| Client Induction | | | |

Onderaan: "For HR: (Name + Signature)".

## Context in het proces

- De **interne PGC-inductie** (HR + OHSEQ) vindt plaats op **maandag, woensdag en vrijdag**
  (zie `werving-selectie-introductie.md`). De *Department Induction* is bij de afdeling, de
  *Client Induction* bij de klant (RGM: client induction training — vereist medical certificate,
  SOR, valid police clearance en valid identification).
- De inductie-presentielijst en dit formulier worden beide in het PGC-inductiebestand
  bijgehouden (wekelijks).

## Vertaling naar de ATS

Vier onboarding-stappen (seed, `onboarding_step_templates`): **HR-inductie**, **OHSEQ-inductie**,
**Afdelingsinductie**, **Client-inductie**. Wie de stap afrondt en wanneer staat in
`onboarding_progress.completed_by` / `completed_at`; de handtekeningen blijven op papier.
Dit is het enige formulier uit de set zonder eigen invulvelden buiten die vier rijen.
