/**
 * onboarding-steps.ts
 * WAT:    De globale onboarding-checklist, afgeleid van de Aanstellingsprocedure
 *         (PGC-HR-PR-0501-05, versie 30-09-2026), het inductieformulier (PGC-HR-F-0506-04) en
 *         "Basisgegevens nieuwe medewerker" (PGC-HR-F-0509-06).
 * WAAROM: Eén bron voor de seed (`drizzle/seed.ts` upsert op titel) en voor de dossier-index
 *         (die de vier inductie-stappen herkent aan hun titel). Geen `@/`-imports: het
 *         seed-script draait buiten Next.js.
 */

export const INDUCTION_STEP_TITLES = {
  hr: 'HR-inductie',
  ohseq: 'OHSEQ-inductie',
  department: 'Afdelingsinductie',
  client: 'Client-inductie',
} as const

export const ONBOARDING_STEPS: { title: string; description: string }[] = [
  {
    title: 'Bedrijfsbeleid & regels bespreken',
    description: 'HR-beleid, kwaliteitsbeleid, GAM-beleid en personeelsgids doornemen.',
  },
  {
    title: 'Basisgegevens nieuwe medewerker invullen',
    description:
      'Basisgegevensformulier laten invullen (incl. bankrekeningnr en 3 noodcontacten) en controleren.',
  },
  {
    title: 'Werkgeversverklaring bankrekening',
    description:
      'Alleen als de nieuwe medewerker nog geen bankrekeningnummer heeft: werkgeversverklaring opmaken voor het openen van een rekening.',
  },
  {
    title: 'Arbeidsovereenkomst ondertekenen',
    description:
      'AO opmaken (met pasfoto) en bespreken; proeftijd 2 maanden, daarna termijn/verlengingen conform contractstadium.',
  },
  { title: 'Personeelsdossier aanmaken', description: 'Personeelsdossier + index personeelsdossier (PGC-HR-F-0508-04) bijwerken.' },
  {
    title: 'Medische verzekering aanvragen',
    description: 'Medische verzekering aanvragen; polis en kaart in het dossier; maandelijks overzicht bijhouden.',
  },
  {
    title: 'Client pre-employment documenten mailen',
    description:
      'Pre-employment pakket naar de client: medical certificate, SOR-verklaring (op naam), valid police clearance, valid identification; start- en inductiedatum bevestigd.',
  },
  {
    title: INDUCTION_STEP_TITLES.hr,
    description: 'Interne PGC-inductie (maandag, woensdag of vrijdag) — inductieformulier PGC-HR-F-0506-04.',
  },
  { title: INDUCTION_STEP_TITLES.ohseq, description: 'OHSEQ-inductie — inductieformulier PGC-HR-F-0506-04.' },
  { title: INDUCTION_STEP_TITLES.department, description: 'Afdelingsinductie — inductieformulier PGC-HR-F-0506-04.' },
  {
    title: INDUCTION_STEP_TITLES.client,
    description: 'Client induction training (RGM) — inductieformulier PGC-HR-F-0506-04.',
  },
  {
    title: 'PPE aanvragen',
    description: 'PPE-aanvraag bij de OHSEQ-afdeling; PPE ophalen; PPE-afgifteformulier laten ondertekenen.',
  },
  {
    title: 'Rondleiding & kennismaking',
    description:
      'Rondleiding en kennismaking met het personeel (optioneel — staat niet meer in de procesversie van 30-09-2026).',
  },
  {
    title: 'Memo nieuwe medewerker versturen',
    description:
      'Memo naar het totale personeel mailen (optioneel — staat niet meer in de procesversie van 30-09-2026).',
  },
  {
    title: 'Eerste dag on-site begeleiding',
    description: 'Telefonisch of on-site begeleiden op de eerste werkdag bij de client.',
  },
  {
    title: 'Proeftijdevaluatie week 4',
    description: 'Tussentijdse evaluatie aan de hand van de afdelingsbeschrijving.',
  },
  {
    title: 'Proeftijdevaluatie week 8',
    description: 'Eindevaluatie proeftijd — proeftijd beoordelingsformulier invullen en bespreken.',
  },
]
