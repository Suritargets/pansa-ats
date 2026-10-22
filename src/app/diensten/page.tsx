/**
 * diensten/page.tsx
 * WAT:    Voor bedrijven: hoe Pansa werft, selecteert en plaatst (uit het werving-, selectie- en
 *         introductieproces PGC-HR-PR-0501-05), wat het klantportaal biedt, en contract & HR-support.
 *         Ankers: #onboarding, #rapportages, #hr-support (gebruikt door de kaarten op de voorpagina).
 */

import { ChevronRight } from 'lucide-react'
import { CtaLink, Panel, PanelTitle, PublicShell } from '@/components/landing/PublicShell'

const PHASES = [
  {
    title: 'Werving',
    steps: ['Uw aanvraag met job scope en Req#/RFP-ID#', 'Registratie en documentcontrole van kandidaten', 'Administratieve selectie op uw kwalificatie-eisen'],
  },
  {
    title: 'Selectie',
    steps: [
      'Sollicitatiegesprek (algemeen + technisch) en antecedentenonderzoek',
      'Interview en test bij u on site of online; assessment (welding, machining, mechanical, technician)',
      'Medische keuring, SOR-verzekering en pre-employment documenten voor uw inductie',
    ],
  },
  {
    title: 'Aanstelling & onboarding',
    steps: [
      'Arbeidsovereenkomst, personeelsdossier en PPE',
      'HR-, OHSEQ-, afdelings- en client-inductie',
      'Begeleiding op de eerste werkdag en evaluatie in week 4 en week 8 van de proeftijd',
    ],
  },
]

export default function DienstenPage() {
  return (
    <PublicShell
      mode="bedrijven"
      title="Diensten"
      intro="Van aanvraag tot een medewerker die presteert: één aanspreekpunt voor werving, selectie, plaatsing, onboarding en HR-administratie."
    >
      <div className="space-y-6">
        <Panel id="onboarding">
          <PanelTitle>Plaatsing & onboarding</PanelTitle>
          <p className="mt-2 text-sm text-white/80">
            Ons doel: minimaal 90% van de nieuwe krachten voldoet aan uw eisen en minimaal 90% presteert naar
            uw tevredenheid. Daarvoor doorloopt elke kandidaat drie fasen.
          </p>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {PHASES.map((phase, i) => (
              <li key={phase.title} className="border-l-2 border-[var(--mode)] pl-4">
                <p className="font-heading text-xl leading-none font-semibold tracking-wide uppercase">
                  <span className="mr-2 text-[var(--mode)]">{String(i + 1).padStart(2, '0')}</span>
                  {phase.title}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                  {phase.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel id="rapportages">
          <PanelTitle>Rapportages & klantportaal</PanelTitle>
          <div className="mt-3 grid gap-4 text-sm text-white/80 md:grid-cols-2">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Gedeelde kandidaatprofielen met CV in het Pansa-sjabloon, inclusief Community-of-Interest-gegevens</li>
              <li>Feedback per kandidaat en status van elke aanvraag</li>
              <li>Vacature-aanvragen met functie-eisen per categorie, direct in onze pipeline</li>
            </ul>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Maandelijkse overzichten: personeelsbestand, new hires, workforce total list, manhours</li>
              <li>Badge-overzicht met vervaldatums en contractperiodes</li>
              <li>Verzuim en sick leave per medewerker</li>
            </ul>
          </div>
          <div className="mt-5">
            <CtaLink href="/client">
              Naar het klantportaal
              <ChevronRight className="size-5" />
            </CtaLink>
          </div>
        </Panel>

        <Panel id="hr-support">
          <PanelTitle>Contract & HR support</PanelTitle>
          <div className="mt-3 grid gap-4 text-sm text-white/80 md:grid-cols-2">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Arbeidsovereenkomsten in stadia: proeftijd 2 maanden, termijn 4 maanden, verlenging 6 en 12 maanden</li>
              <li>Salarisadministratie, benefits, SOR-ongevallenverzekering en medische verzekering</li>
              <li>Medische keuring per functie en PPE conform job scope</li>
            </ul>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Naleving van uw gedragscode en zero-tolerance-regels; drugs- en alcoholtest op verzoek</li>
              <li>Wekelijks een HR-vertegenwoordiger on site; kwartaalsessies HR & OHSEQ</li>
              <li>Niet-presterende of veel verzuimende medewerkers tijdig vervangen</li>
            </ul>
          </div>
          <p className="mt-5 text-sm text-white/70">
            HR-afdeling: humanresource@hpsnv.com · +597 323451 · mobiel +597 7698051
          </p>
          <div className="mt-4">
            <CtaLink href="/request-staffing">
              Plaats een vacature
              <ChevronRight className="size-5" />
            </CtaLink>
          </div>
        </Panel>
      </div>
    </PublicShell>
  )
}
