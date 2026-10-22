---
name: pansa-ats-process
description: The real Pansa Group recruitment/selection/onboarding process (from the company's internal HR documents, version of 30 September 2026) and how it maps onto the Pansa ATS data model and app structure. Use whenever building, changing, or reasoning about a feature in the pansa-ats codebase — the application pipeline, interviews, reference checks (antecedentenonderzoek), personnel file index, contracts and badges, onboarding/inductions, the CRM entities (clients, suppliers, job categories), WhatsApp contact moments, or the client/candidate portals — so the feature matches the actual HR workflow instead of a generic ATS assumption. Also use when asked about Pansa's hiring process, RGM/ZIJIN-RGM placements, or the source HR forms (PGC-HR-F-/PR- codes) under references/.
---

# Pansa ATS — domain process & data model mapping

Pansa ATS is not a generic applicant tracker. It digitizes a specific, documented HR
process used by **CCC H. Pansa & Sons N.V.** (a Pansa Group of Companies subsidiary) to
recruit, select, and onboard manpower/outsourcing staff placed at industrial mining clients
(the flagship client being **ZIJIN-RGM** — Rosebel Gold Mines). Read this before adding or
changing any feature so it stays faithful to the real process. The full source documents are
converted to markdown in `references/` — that is the committed, durable copy (the Word originals
live in `hr new/`, which is gitignored/local-only).

**When HR hands over new or changed documents, use the `pansa-hr-docs-sync` skill** — it holds the
repeatable docx → diff → schema/seed/UI/docs routine. This skill is the domain knowledge it updates.

## The document set (all 10 are in `references/`)

| Document | Code | Reference file |
|---|---|---|
| Werving-, selectie- en introductieproces (v. 30-09-2026) | PGC-HR-PR-0501-05 | `werving-selectie-introductie.md` |
| Registratieformulier | PGC-HR-F-0501-05 | `registratie-form.md` |
| Curriculum Vitae (incl. Community of Interest) | PGC-HR-F-0503-05 | `cv-template.md` |
| Vragenlijst sollicitatiegesprek (algemeen, gescoord) | PGC-HR-F-0504-04 | `interview-algemeen.md` |
| Induction sheet | PGC-HR-F-0506-04 | `induction-sheet.md` |
| Vragenlijst antecedentenonderzoek | PGC-HR-F-0507-04 | `antecedentenonderzoek.md` |
| Index personeelsdossier | PGC-HR-F-0508-04 | `index-personeelsdossier.md` |
| Basisgegevens nieuwe medewerker | PGC-HR-F-0509-06 | `basisgegevens-nieuwe-medewerker.md` |
| Arbeidsovereenkomst voor bepaalde tijd (ZIJIN-RGM) | PGC-HR-F-0513-05 | `arbeidsovereenkomst.md` |
| Vragenlijst job interview / work experience | PGC-HR-F-0520-01 | `interview-werkervaring.md` |

The bestandsnummers in the Word file names (`1.`, `2.`…) are **not stable** between versions — always match on the document code.

## The business relationship, precisely

This is the one modeling distinction that matters most and was originally wrong in the
schema — keep it straight:

- **`companies`** — Pansa's own org (Pansa Group + subsidiaries: CCC H. Pansa & Sons N.V.,
  Pansa Machine Shop N.V., Pansa Industries). A candidate's `applications.companyId` is
  *which Pansa company employs them*.
- **`clients`** — external customers (mining companies like ZIJIN-RGM) who staff get **placed
  at** via manpower/outsourcing. `applications.clientId` (nullable — set once a placement
  target is known) and `client_candidate_shares` both point here, never at `companies`.
- **`suppliers`** — leverancier/relatie: medical exam providers, temp-staffing agencies for
  `uitzendkrachten` requisitions, the SOR insurance provider, training institutes, government
  bodies. One merged CRM entity by design decision (not split into separate "supplier" and
  "relation" tables).

## The three-phase process → application status

Full detail: `references/werving-selectie-introductie.md`. The 30-09-2026 version changed several
things versus January (WhatsApp instead of weekly SMS, concrete client pre-employment rules,
index personeelsdossier, more monthly lists) — that file has a "what changed" table.

1. **Wervingsprocedure (Recruitment)** — registration (`references/registratie-form.md` is the
   source of truth for candidate fields), requisition (**Req#/RFP-ID#**, weekly "RGM Labor request
   monitoring"), document check, administrative screening. → `application_status`: `new`, `in_review`.
2. **Selectieprocedure (Selection)** — interview(s) (see below), **antecedentenonderzoek** (reference
   check by phone), client interview + test, assessment (Welding, Machining, Mechanical, Technician),
   second interview on terms, medical exam (per function, 1 month valid for emergency), SOR insurance,
   client pre-employment pack. → `shortlisted`, `interview`, `offer`.
3. **Aanstellingsprocedure (Appointment/onboarding)** — internal PGC induction (Mon/Wed/Fri), basisgegevens,
   contract signing (stages: 2-month probation → 4-month term → 6-month extension → 12-month extension →
   permanent — `contractStageEnum`), personnel file + index, PPE, the four inductions, **probation
   evaluation at week 4 and week 8**. → `onboarding`, `active`.

KPIs from the source doc (shown on `/admin/dashboard` as static targets, not live metrics — there's no
boolean anywhere tracking "met client requirements"): **≥90%** of new hires meet client requirements,
**≥90%** perform to client satisfaction.

## Where each document lives in the data model / app

| Concept | Data | UI |
|---|---|---|
| Registration number | `candidates.registration_number` (paper form's number) + `registration_seq` (identity fallback → `REG-#####`, see `src/lib/registration.ts`) | profile, candidate sheet, digitize form |
| Police clearance date | `candidates.police_clearance_date` | registration form step 1, OCR, candidate sheet, CV, export |
| Community of Interest (RGM local content) | `candidates.community_of_interest` jsonb (`CommunityOfInterest`), areas in `src/constants/coi.ts` | application form "Overig", candidate sheet, CV, export |
| Reference check (antecedentenonderzoek) | table `reference_checks` (many per application) | tab **Antecedenten** |
| Index personeelsdossier + client pre-employment | *computed*, no table — `src/lib/dossier.ts` from documents, interviews, reference checks, inductions, contracts, emergency contacts | tab **Dossier**, print `/admin/applications/[id]/dossier` |
| Inductions (HR/OHSEQ/department/client) | four `onboarding_step_templates` (titles in `src/constants/onboarding-steps.ts`) | Onboarding tab |
| Basisgegevens | `employment_contracts` (badge, wage, bank, department, project, level) + `emergency_contacts` (max 3) + `candidates.general_practitioner` | Contract tab |
| Arbeidsovereenkomst | `employment_contracts`; verbatim text in `src/constants/employment-contract-text.ts` | print `/admin/applications/[id]/contract` |
| Contract / badge / probation monitoring | `employment_contracts.end_date`, `badge_expiry_date`, `probation_week{4,8}_notes`; rules in `src/lib/contract-monitor.ts` | `/admin/contracts` + dashboard alerts |
| Document kinds for the dossier | `document_kind` enum (`medical_certificate`, `sor_declaration`, `medical_insurance`, `signed_contract`, `drivers_license`, `diploma`, `photo_family_docs`, …) | Dossier tab upload |
| WhatsApp contact moments | no data — templates in `src/constants/whatsapp.ts` (wa.me links; nothing is sent automatically) | profile sidebar |
| Req#/RFP-ID# | `client_vacancy_requests.reference_number` | client forms + `/admin/client-requests` |

## Two interview types — do not conflate them

`interviews.type` distinguishes them; both feed `InterviewForm.tsx`:

- `general` — the scored interview (`references/interview-algemeen.md`, doc
  PGC-HR-F-0504-04): 15 fixed questions, each scored, `interviews.totalScore` /
  `averageScore` computed from the per-question scores. The form's score columns are labelled **5 · 6 · 7**
  (meaning undocumented — open question); the app accepts 1-10.
- `work_experience` — the open technical interview (`references/interview-werkervaring.md`,
  doc PGC-HR-F-0520-01): open categories (core tasks, safety, technical knowledge ×3,
  materials, tools, machines, technical drawing, software, ISO/procedures, housekeeping,
  work attitude, language), no scoring.
- `client`, `medical`, `second_terms` — the remaining selection-phase steps, free-text
  notes only, no fixed question set (no source form provided one).

The **antecedentenonderzoek** is a third, separate thing (a phone call to a former employer,
`reference_checks`) — not an interview type.

## Job categories are real, not generic

`job_categories` is seeded (see `drizzle/seed.ts`) from the exact 35-role checklist on the
physical registration form (`references/registratie-form.md`) — AC Technician through Tire
Man, plus "Other". Don't invent new generic role names; if a new role is needed, add it to
that seed list with a `branche`/`level` classification, matching the existing scheme.

## Onboarding checklist

`onboarding_step_templates` is seeded from `src/constants/onboarding-steps.ts` (aanstellingsprocedure +
induction sheet + basisgegevens). The seed **upserts on title** — never go back to "only when the table
is empty", or existing databases never receive steps from a newer process version. Leave requirement noted
in the source doc: 12 leave days/year, +2/year up to a max of 18.

## Roles (real-world → `user_role` enum)

HR-medewerker / HR-manager → `hr_staff` / `super_admin`. Verantwoordelijke van de afdeling
→ typically `recruiter` or `super_admin` depending on scope. QC-medewerker/EN-medewerker
(assessment) and SS-medewerker (introductie) aren't separate app roles today — they're
folded into `hr_staff`/`recruiter`; split them out only if real usage shows a need for
narrower permissions.

## Known open questions (do not silently resolve)

Contract article 2 (6 months + 2 months probation) vs. the stage model; the meaning of score columns 5/6/7;
validity period of police clearance / ID; WhatsApp wording (the process names six moments, not the texts).
The current list is in `docs/process/todo.md`.

## When building a new feature

1. Check whether a source form in `references/` already defines the fields — use its exact
   Dutch terminology in the UI (this app's UI copy is Dutch throughout) rather than
   inventing English/generic labels.
2. Respect the `companies` vs `clients` vs `suppliers` split above — never add a new FK
   that conflates a Pansa-internal company with an external client or supplier.
3. Client-portal and candidate-portal features must scope every query/action off
   `session.clientId` / `session.candidateId` (see `src/lib/auth.ts` `SessionData`), never
   off a route param or form field — see the IDOR note in `src/services/applications.ts`
   for the exact failure mode this prevents.
4. Prefer a *computed view* over a new table when the data already exists (the dossier index is the example).
5. Legal/contract text is copied verbatim from the Word source; only placeholders come from data.
