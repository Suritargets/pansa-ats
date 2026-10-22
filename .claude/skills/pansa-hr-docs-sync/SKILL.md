---
name: pansa-hr-docs-sync
description: Werkwijze om nieuwe of gewijzigde Pansa HR-Worddocumenten (map "hr new", PGC-HR-F-/PR-codes — registratieformulier, CV, vragenlijsten, antecedentenonderzoek, inductie, basisgegevens, arbeidsovereenkomst, index personeelsdossier, werving-selectie-introductieproces) te verwerken in de pansa-ats codebase: docx → tekst, diff tegen de skill-referenties, en de wijziging doorvoeren in schema, seed, UI en documentatie. Gebruik zodra de gebruiker nieuwe HR-documenten aanlevert, zegt dat een formulier of het proces is aangepast, "update met de nieuwe HR-docs", "verwerk deze documenten", of wanneer een formulier-veld/stap/documentcode in de app niet meer lijkt te kloppen met het papieren origineel.
---

# Pansa HR-docs → ATS synchroniseren

De HR-afdeling beheert de echte werkwijze in Word (`PGC-HR-…` formulieren). De ATS moet die
formulieren volgen, niet andersom. Deze skill is de herhaalbare route van "nieuwe docx" naar
"app + skill kloppen weer". Domeinkennis staat in de skill **`pansa-ats-process`** (lees die
eerst, vooral `references/`); deze skill beschrijft alleen *hoe je synchroniseert*.

## 1. Converteer

```bash
python -I .claude/skills/pansa-hr-docs-sync/scripts/docx2txt.py --dir "hr new" <scratchpad>/txt
```

- Gebruik een scratch-map buiten de repo voor de `.txt`-bestanden; de `.docx` blijven in
  `hr new/` (staat in `.gitignore`, bedrijfsinterne documenten gaan niet naar git).
- Het script gebruikt alleen de stdlib, geeft tabellen als `<TABLE>`-blokken en voegt
  header/footer-tekst toe — daar staat de **documentcode** (`PGC-HR-F-0501-05`) en de printdatum.
- `hpshrdocumentenai.zip` in die map is een duplicaat van de .docx-bestanden (zelfde bestandsnamen
  en groottes); controleer dat met `python -c "import zipfile;…infolist()"` en negeer hem dan.
- Afbeeldingen (logo's) in de docx worden niet geëxtraheerd; als een formulier veel afbeeldingen
  bevat en weinig tekst, controleer dan handmatig of er iets ontbreekt.

## 2. Diff per document tegen de referentie

Elk document heeft een referentiebestand in `.claude/skills/pansa-ats-process/references/`:

| Document (documentcode) | Referentie |
|---|---|
| Werving-, selectie- en introductieproces (PGC-HR-PR-0501-05) | `werving-selectie-introductie.md` |
| Registratieformulier (PGC-HR-F-0501-05) | `registratie-form.md` |
| Vragenlijst sollicitatiegesprek (PGC-HR-F-0504-04) | `interview-algemeen.md` |
| Vragenlijst job interview / work experience (PGC-HR-F-0520-01) | `interview-werkervaring.md` |
| Vragenlijst antecedentenonderzoek (PGC-HR-F-0507-04) | `antecedentenonderzoek.md` |
| Curriculum Vitae (PGC-HR-F-0503-05) | `cv-template.md` |
| Induction sheet (PGC-HR-F-0506-04) | `induction-sheet.md` |
| Basisgegevens nieuwe medewerker (PGC-HR-F-0509-06) | `basisgegevens-nieuwe-medewerker.md` |
| Index personeelsdossier (PGC-HR-F-0508-04) | `index-personeelsdossier.md` |
| Arbeidsovereenkomst (PGC-HR-F-0513-05) | `arbeidsovereenkomst.md` |

Lees het nieuwe `.txt` en de bestaande referentie naast elkaar. **Het bestandsnummer in de
bestandsnaam (`1.`, `2.`…) is niet stabiel** — de nummering veranderde tussen versies; match op
de *documentcode* in de footer. Noteer per document: nieuw veld · verwijderd veld · hernoemde
tekst · gewijzigde cijfers/termijnen/namen (bv. "RGM" → "ZIJIN-RGM") · gewijzigde documentcode of datum.

Let extra op de dingen die in de laatste sync het meest opleverden:
- **Proces-doc vs. formulier**: het proces noemt stappen en lijsten die nergens als formulier bestaan
  (WhatsApp-berichten, maandelijkse overzichten, badge-vervaldatum). Dat zijn functionele eisen.
- **Verborgen inconsistenties** tussen documenten (bv. contractstadia vs. "6 maanden" in het AO,
  scorekolommen 5/6/7 vs. de 1–5-schaal in de app). Meld die als open vraag; los ze niet
  stilzwijgend op met een eigen aanname.
- Nieuwe **gestructureerde** blokken (zoals de COI-vragen op het CV) horen in kolommen/jsonb,
  niet in een vrij tekstveld, als iemand er later op moet rapporteren.

## 3. Voer door — in deze volgorde

1. **Referenties** (`pansa-ats-process/references/*.md`): herschrijf of werk bij; zet bovenaan
   documentcode + datum + `Bronbestand`. Voeg een "wat veranderd is"-tabel toe bij een nieuwe
   procesversie. Nieuwe documenten → nieuw referentiebestand + regel in de tabel hierboven en in
   `pansa-ats-process/SKILL.md`.
2. **Schema** (`drizzle/schema.ts`): alleen *additieve* wijzigingen (nieuwe kolom nullable of met
   default; nieuwe tabel; nieuwe enum-waarde). Daarna `npx drizzle-kit generate --name <naam>` en
   controleer de SQL. Geen kolommen verwijderen of hernoemen zonder expliciete beslissing van de
   gebruiker — er staat echte kandidaatdata in de database.
3. **Types/queries/services** (`src/types/database.ts`, `src/services/*`).
4. **UI** — Nederlandstalig, met de exacte terminologie van het formulier. Formulier-/printpagina's
   volgen het papieren origineel (zelfde volgorde, nummering, kopteksten).
5. **Seed** (`drizzle/seed.ts`): **idempotent op titel/naam** (upsert), nooit "alleen als de tabel
   leeg is" — bestaande databases moeten de nieuwe stappen ook krijgen.
6. **Handleiding** (`src/app/admin/settings/handleiding/page.tsx`), `README.md`,
   `docs/process/todo.md` en de DEVLOG bijwerken.
7. **Controleer**: `npx tsc --noEmit`, `npm run lint`, `npm run build`. Lees voor Next.js-code eerst de
   relevante gids in `node_modules/next/dist/docs/` (zie AGENTS.md — deze versie wijkt af van wat je
   uit je hoofd kent).

## 4. Database-migratie toepassen

Pas een migratie **niet** zonder bevestiging van de gebruiker toe op de echte Neon-database als
je niet zeker weet dat het een dev-branch is. Additief ≠ geen risico: een mislukte `ALTER TYPE`
kan de productie-app breken tot de code uitgerold is. Zeg expliciet in je rapport of de migratie
is toegepast (`npm run db:push`) of nog moet.

## 5. Rapporteer

Eindig met: welke documenten veranderd waren, wat er in app/skill is doorgevoerd, wat **bewust niet**
is gedaan, en de lijst open vragen aan HR (inconsistenties, ontbrekende betekenissen).
