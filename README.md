# Pansa ATS

Applicant Tracking System voor **Pansa Group of Companies N.V.** en subsidiaries
(CCC H. Pansa & Sons N.V., Pansa Machine Shop N.V., Pansa Industries) — van online
sollicitatie en digitalisering van handgeschreven aanvragen tot manpower/outsourcing-plaatsing
bij industriële mijnbouwklanten (vlaggenschip-klant: ZIJIN-RGM / Rosebel Gold Mines).

Het systeem digitaliseert het echte HR-proces van CCC H. Pansa & Sons N.V.
(*Werving-, selectie- en introductieproces*, PGC-HR-PR-0501-05) en de bijbehorende formulieren.
De brondocumenten staan in `hr new/` (lokaal, niet in git); de vertaling naar de app staat in
`.claude/skills/pansa-ats-process/`.

## Wat het systeem doet

**Werving & selectie**
- **Sollicitatieformulier** (`/apply`, ook embedbaar) — 7-staps wizard met alle velden van het
  registratieformulier, bewijs van goed gedrag (verplicht), Community-of-Interest-vragen voor RGM.
- **Digitaliseren** (`/admin/digitize`) — papieren/gescande formulieren overtypen, met AI-OCR
  (altijd controleren) en een bulk-modus; het registratienummer van het papier kan worden overgenomen.
- **Sollicitaties & profiel** (`/admin/applications/[id]`) — tabs Profiel · Interviews ·
  **Antecedenten** (referentiecheck, PGC-HR-F-0507-04) · Onboarding · Contract · **Dossier** ·
  Documenten; statuspipeline met audit-trail; CV printen; delen met een client; **WhatsApp**-knoppen
  voor de zes contactmomenten uit het proces.
- **Interviews** — algemeen (15 gescoorde vragen, score 1-10) en werkervaring (open), beheerbare vragenbank.

**Aanstelling & opvolging**
- **Onboarding-checklist** volgens de aanstellingsprocedure, incl. de vier inducties (HR/OHSEQ/afdeling/client).
- **Dossier** — Index Personeelsdossier (PGC-HR-F-0508-04, 11 onderdelen) berekend uit bestaande data +
  client pre-employment pakket (medical certificate, SOR, police clearance, ID); printbaar.
- **Contracten & badges** (`/admin/contracts`) — einddatum, RGM-badge-vervaldatum, proeftijdevaluaties
  week 4/8, met waarschuwingen op het dashboard; vooringevulde **Arbeidsovereenkomst** (PGC-HR-F-0513-05)
  afdrukken per contractstadium.
- **Basisgegevens nieuwe medewerker** — contractvelden + tot 3 noodcontacten.

**CRM & portalen**
- Clienten, Leverancier/Relatie, functiecategorieën (de 35 functies van het registratieformulier).
- **Klantportaal** (`/client`): gedeelde profielen, feedback, vacature-aanvragen (met Req#/RFP-ID#).
- **Kandidaatportaal** (`/candidate`): eigen status en contactgegevens.

**Export & integraties**: payroll-CSV, algemene CSV, API-sleutels (`/api/v1`), webhooks, chat-widget met
kennisbank, audit-log, rapportages (funnel + doorlooptijd per fase).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — let op: deze versie wijkt af van oudere Next.js,
  lees `node_modules/next/dist/docs/` voor je code schrijft (zie `AGENTS.md`)
- **Neon Postgres + Drizzle ORM** (`drizzle/schema.ts`, `drizzle/migrations/`)
- Eigen cookie-sessie (`src/lib/auth.ts`, jose + bcryptjs); rollen `super_admin`, `hr_staff`, `recruiter`, `client`, `candidate`
- Vercel Blob (documenten), Vercel AI Gateway (OCR + chat), shadcn/ui (Base UI), react-hook-form + zod

## Setup

1. `npm install`
2. Maak een Neon-project (of via de Vercel Marketplace) en kopieer de **pooled** connection string.
3. Kopieer `.env.example` naar `.env.local` en vul in (`DATABASE_URL`, `SESSION_SECRET`,
   `BLOB_READ_WRITE_TOKEN`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`; optioneel `SEED_CLIENT_*`).
   Voor OCR en de chat-widget: `vercel env pull` (levert `VERCEL_OIDC_TOKEN` voor de AI Gateway).
4. Schema naar de database zetten: `npm run db:push`
5. Basisdata zaaien: `npm run db:seed` — bedrijven, 35 functies, interviewvragen, onboarding-stappen
   en het eerste admin-account. **Idempotent**: opnieuw draaien voegt alleen ontbrekende onboarding-stappen
   toe en werkt volgorde/omschrijving bij (bestaande voortgang blijft behouden).
6. Optioneel demo-data voor het testen van pipeline en rapportage: `npm run db:seed-demo`
7. `npm run dev` → `/admin` (staff-login), `/apply`, `/client`, `/candidate`

## Database-migraties

```bash
npm run db:generate   # nieuwe SQL-migratie genereren uit drizzle/schema.ts
npm run db:push       # schema direct naar Neon pushen (dev)
npm run db:studio     # Drizzle Studio
```

Migratie `0010_hr_docs_sept_2026` (HR-documenten van september 2026) is **uitsluitend additief**:
nieuwe tabel `reference_checks`, nieuwe kolommen op `candidates` (`registration_number`,
`registration_seq`, `community_of_interest`, `general_practitioner`), `employment_contracts`
(`badge_expiry_date`, `department`, `job_level`, `project_location`) en `client_vacancy_requests`
(`reference_number`), en zeven nieuwe `document_kind`-waarden. Er wordt niets verwijderd of hernoemd.
Draai na `db:push` ook `npm run db:seed` zodat bestaande databases de nieuwe onboarding-stappen krijgen.

## Huisstijl & foto's

De voorpagina en rapportages volgen het Pansa-ontwerp (donkergroen, lime/geel). Foto's en logo voor de
voorpagina horen in `public/landing/` — zie de README in die map voor de bestandsnamen.

## Nieuwe HR-documenten verwerken

Als HR de Word-formulieren of het procesdocument aanpast: gebruik de skill
**`pansa-hr-docs-sync`** (`.claude/skills/pansa-hr-docs-sync/`) — docx → tekst, diff tegen de
referenties, doorvoeren in schema/seed/UI/documentatie. De domeinkennis staat in
**`pansa-ats-process`**.

## Controle voor release

```bash
npx tsc --noEmit && npm run lint && npm run build
```

## Deployen

Draait op Vercel (https://pansa-ats.vercel.app). Env vars (`DATABASE_URL`, `SESSION_SECRET`,
`BLOB_READ_WRITE_TOKEN`) moeten ook in het Vercel-project staan — zie `vercel env`. Zet een migratie
**eerst** op de database en deploy daarna de code die erop leunt.

Openstaande punten en vragen aan HR: `docs/process/todo.md`.
