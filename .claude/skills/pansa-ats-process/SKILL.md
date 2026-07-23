---
name: pansa-ats-process
description: >-
  The real Pansa Group recruitment/selection/onboarding process (from the
  company's internal HR documents) and how it maps onto the Pansa ATS
  data model and app structure. Use whenever building, changing, or
  reasoning about a feature in the pansa-ats codebase — the application
  pipeline, interviews, contracts, onboarding, the CRM entities (clients,
  suppliers, job categories), or the client/candidate portals — so the
  feature matches the actual HR workflow instead of a generic ATS
  assumption. Also use when asked about Pansa's hiring process, RGM
  placements, or the source HR forms under docs/process/word/.
---

# Pansa ATS — domain process & data model mapping

Pansa ATS is not a generic applicant tracker. It digitizes a specific, documented HR
process used by **CCC H. Pansa & Sons N.V.** (a Pansa Group of Companies subsidiary) to
recruit, select, and onboard manpower/outsourcing staff placed at industrial mining clients
(the flagship client being **RGM** — Rosebel Gold Mines). Read this before adding or
changing any feature so it stays faithful to the real process — the full source documents
are in `references/`, converted from the company's internal Word docs
(`docs/process/word/*.docx`, gitignored/local-only — these markdown files are the
committed, durable copy).

## The business relationship, precisely

This is the one modeling distinction that matters most and was originally wrong in the
schema — keep it straight:

- **`companies`** — Pansa's own org (Pansa Group + subsidiaries: CCC H. Pansa & Sons N.V.,
  Pansa Machine Shop N.V., Pansa Industries). A candidate's `applications.companyId` is
  *which Pansa company employs them*.
- **`clients`** — external customers (mining companies like RGM) who staff get **placed
  at** via manpower/outsourcing. `applications.clientId` (nullable — set once a placement
  target is known) and `client_candidate_shares` both point here, never at `companies`.
- **`suppliers`** — leverancier/relatie: medical exam providers (HCCO for RGM, Health
  Control for PMS/HPS), temp-staffing agencies for `uitzendkrachten` requisitions, the SOR
  insurance provider, training institutes, government bodies. One merged CRM entity by
  design decision (not split into separate "supplier" and "relation" tables).

## The three-phase process → application status

Full detail: `references/werving-selectie-introductie.md` (doc PGC-HR-PR-0501-05).

1. **Wervingsprocedure (Recruitment)** — registration (`references/registratie-form.md`
   has the full field list — this is the source of truth for candidate/application
   fields), weekly SMS acknowledgment, staffing requisition approval, administrative
   screening. → `application_status`: `new`, `in_review`.
2. **Selectieprocedure (Selection)** — background/reference check, **two distinct
   interviews** (see below), client interview + test, assessment, second interview on
   terms, medical exam, SOR insurance application. → `shortlisted`, `interview`, `offer`.
3. **Aanstellingsprocedure (Appointment/onboarding)** — policy briefing, contract signing
   (stages: 2-month probation → 4-month term → 6-month extension → 12-month extension →
   permanent — see `contractStageEnum`), personnel file, PPE, induction, **probation
   evaluation at week 4 and week 8**. → `onboarding`, `active`.

KPIs from the source doc (surfaced on `/admin/dashboard` as static targets, not yet
computed live metrics — there's no boolean anywhere tracking "met client requirements"):
**≥90%** of new hires meet client requirements, **≥90%** perform to client satisfaction.

## Two interview types — do not conflate them

`interviews.type` distinguishes them; both feed `InterviewForm.tsx`:

- `general` — the scored interview (`references/interview-algemeen.md`, doc
  PGC-HR-F-0504-04): 15 fixed questions, each scored, `interviews.totalScore` /
  `averageScore` computed from the per-question scores.
- `work_experience` — the open technical interview (`references/interview-werkervaring.md`,
  doc PGC-HR-F-0520-01): 12 open categories (core tasks, safety, technical knowledge ×3,
  materials, tools, machines, technical drawing, software, ISO/procedures, housekeeping,
  work attitude, language), no scoring.
- `client`, `medical`, `second_terms` — the remaining selection-phase steps, free-text
  notes only, no fixed question set (no source form provided one).

## Job categories are real, not generic

`job_categories` is seeded (see `drizzle/seed.ts`) from the exact 35-role checklist on the
physical registration form (`references/registratie-form.md`) — AC Technician through Tire
Man, plus "Other". Don't invent new generic role names; if a new role is needed, add it to
that seed list with a `branche`/`level` classification, matching the existing scheme.

## Onboarding checklist

`onboarding_step_templates` is seeded from the HR introduction-topics checklist in
`references/basisgegevens-nieuwe-medewerker.md` (also the source for `employment_contracts`
fields: badge number, hourly wage, bank account, emergency contacts). Leave requirement
noted in the source doc for reference if building a leave-tracking feature: 12 days/year,
+2/year up to a max of 18.

## Roles (real-world → `user_role` enum)

HR-medewerker / HR-manager → `hr_staff` / `super_admin`. Verantwoordelijke van de afdeling
→ typically `recruiter` or `super_admin` depending on scope. QC-medewerker/EN-medewerker
(assessment) and SS-medewerker (introductie) aren't separate app roles today — they're
folded into `hr_staff`/`recruiter`; split them out only if real usage shows a need for
narrower permissions.

## When building a new feature

1. Check whether a source form in `references/` already defines the fields — use its exact
   Dutch terminology in the UI (this app's UI copy is Dutch throughout) rather than
   inventing English/generic labels.
   1a. All 6 source documents: `werving-selectie-introductie.md`,
   `registratie-form.md`, `cv-template.md`, `interview-werkervaring.md`,
   `interview-algemeen.md`, `basisgegevens-nieuwe-medewerker.md`.
2. Respect the `companies` vs `clients` vs `suppliers` split above — never add a new FK
   that conflates a Pansa-internal company with an external client or supplier.
3. Client-portal and candidate-portal features must scope every query/action off
   `session.clientId` / `session.candidateId` (see `src/lib/auth.ts` `SessionData`), never
   off a route param or form field — see the IDOR note in `src/services/applications.ts`
   for the exact failure mode this prevents.
