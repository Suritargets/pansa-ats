# Pansa ATS

Applicant Tracking System voor **Pansa Group of Companies N.V.** en subsidiaries
(CCC H. Pansa & Sons N.V., Pansa Machine Shop N.V., Pansa Industries) — van
online sollicitatie en digitalisering van handgeschreven aanvragen tot
manpower/outsourcing-plaatsing bij industriële mijnbouwklanten.

## Wat dit systeem doet (fase 1 — gebouwd)

- **Sollicitatieformulier** (`/apply`) — publieke pagina waar kandidaten solliciteren
  bij een van de Pansa-bedrijven, met CV-upload.
- **Digitalisering van handgeschreven formulieren** (`/admin/digitize`) — staff
  typt een papieren aanvraag over en koppelt een scan/foto als bewijsstuk.
- **Admin dashboard** (`/admin/dashboard`) — overzicht van alle sollicitaties,
  filterbaar op status.
- **Profile sketch** (`/admin/applications/[id]`) — kandidaatprofiel, documenten
  en een statuspipeline (nieuw → in beoordeling → shortlist → gesprek → aanbod →
  onboarding → actief geplaatst, of afgewezen).
- **Staff-login** via een eigen cookie-sessie (`/admin`).

## Wat het datamodel al ondersteunt (fase 2/3 — nog te bouwen)

Zie `drizzle/schema.ts` — de tabellen staan er al, de UI volgt later:

- **Client portal** — mijnbouwklanten loggen in en zien alleen kandidaatprofielen
  die met hen gedeeld zijn (`client_candidate_shares`).
- **Onboarding-tracker** — voortgang per stap, per aanvraag (`onboarding_progress`).
- **Training** — koppelen van trainingen (ASME/AWS/API-standaarden) aan
  kandidaten, met score en voortgang (`trainings`, `candidate_training_progress`).
- **HR/payroll-export** — batches klaarzetten voor export naar een extern
  payroll-systeem (`payroll_export_batches`, `payroll_export_items`).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Neon Postgres + Drizzle ORM** — database, migraties (`drizzle/schema.ts`,
  `drizzle/migrations/`)
- **Eigen cookie-sessie** (`src/lib/auth.ts`) — httpOnly JWT-cookie (jose),
  wachtwoorden gehasht met bcryptjs. `profiles` is de user-tabel zelf.
- **Vercel Blob** — opslag van CV's en scans van handgeschreven formulieren
- **shadcn/ui** (Base UI + Tailwind) — component-library voor de admin-UI
- react-hook-form + zod voor formuliervalidatie

## Setup

1. Installeer dependencies:

   ```bash
   npm install
   ```

2. Maak een Neon-project aan op [neon.tech](https://neon.tech) (of via de Vercel
   Marketplace-integratie in het Vercel-project) en kopieer de pooled
   connection string.

3. Kopieer `.env.example` naar `.env.local` en vul in:
   - `DATABASE_URL` — de Neon connection string
   - `SESSION_SECRET` — willekeurige string, bv.
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `BLOB_READ_WRITE_TOKEN` — uit het Vercel-project (Storage-tab), of
     `vercel blob store add`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — voor het eerste admin-account

4. Zet het schema in Neon:

   ```bash
   npm run db:push
   ```

5. Zaai de Pansa-bedrijven en het eerste `super_admin`-account:

   ```bash
   npm run db:seed
   ```

6. Start de dev-server:

   ```bash
   npm run dev
   ```

   - `/apply` — sollicitatieformulier
   - `/admin` — staff-login
   - `/admin/dashboard` — overzicht sollicitaties
   - `/admin/digitize` — handgeschreven formulier invoeren

## Database-migraties

Schema-wijzigingen gaan via `drizzle/schema.ts`:

```bash
npm run db:generate   # genereert een nieuwe SQL-migratie in drizzle/migrations/
npm run db:push       # (dev) pusht het schema direct naar Neon zonder migratiebestand
npm run db:studio     # Drizzle Studio — DB browsen/bewerken in de browser
```

## Deployen

Draait op Vercel. Env vars (`DATABASE_URL`, `SESSION_SECRET`,
`BLOB_READ_WRITE_TOKEN`) moeten ook in het Vercel-project staan — zie
`vercel env`.

Zie `docs/process/todo.md` voor de openstaande punten per fase.
