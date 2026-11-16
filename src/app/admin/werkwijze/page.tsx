/**
 * admin/werkwijze/page.tsx
 * WAT:    Overzicht voor staff: wie logt waar in, de werkstroom van vraag tot opvolging, de statuspijplijn
 *         en de stand van AI en e-mail.
 * WAAROM: Een cold reader ziet hier in één pagina hoe de app in elkaar zit. Stand van de code op 16-11-2026;
 *         pas de tabellen aan als er iets gebouwd wordt (bv. een rol voor externe recruiters).
 */

import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { AdminShell } from '@/components/admin/AdminShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { ACCESS_SVG, FLOW_SVG, STATUS_SVG } from './diagrams'

const SVG_CSS = `
.wf svg{display:block;width:100%;height:auto;min-width:760px;color:var(--foreground)}
.wf svg text{font-family:inherit}
.wf .box{fill:var(--card);stroke:var(--border);stroke-width:1.2}
.wf .box.staff{fill:color-mix(in srgb,var(--color-brand-green) 13%,var(--card));stroke:var(--color-brand-green)}
.wf .box.sys{fill:var(--muted);stroke-dasharray:3 3}
.wf .box.login{fill:var(--muted)}
.wf .box.gap{fill:#fdf0dc;stroke:#a14a07;stroke-dasharray:5 3}
.wf .t1{font-size:11.5px;font-weight:600;fill:var(--foreground)}
.wf .t2,.wf .lbl{font-size:10.5px;fill:var(--muted-foreground)}
.wf .hdr{font-size:10.5px;font-weight:700;letter-spacing:.08em;fill:var(--muted-foreground)}
.wf .lane{font-size:12px;font-weight:700;fill:var(--color-brand-deep)}
.wf .band{fill:var(--muted)}
.wf .grp{stroke:var(--border);stroke-width:1.5}
.wf .arr{stroke:currentColor;stroke-width:1.4}
.wf .box.gap .t1{fill:#a14a07}
`

function Figure({ svg, caption }: { svg: string; caption: string }) {
  return (
    <figure className="mt-4">
      <div className="wf overflow-x-auto rounded-xl border border-border bg-card p-3" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="mt-2 max-w-3xl text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted text-left text-xs tracking-wider text-muted-foreground uppercase">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-border last:border-0 align-top">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? 'px-3 py-2.5 font-semibold whitespace-nowrap' : 'px-3 py-2.5 text-muted-foreground'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const H2 = 'mt-10 text-2xl font-semibold text-[var(--color-brand-deep)]'

export default async function WerkwijzePage() {
  const session = await requireSession([...STAFF_ROLES])

  return (
    <AdminShell session={session}>
      <style>{SVG_CSS}</style>
      <PageHeader title="Werkwijze" subtitle="Wie logt waar in, hoe een kandidaat door het systeem gaat en wat er aan AI en e-mail zit. Stand 16-11-2026." />

      <div className="max-w-5xl">
        <Table
          head={['Portaal', 'Status', 'Wat het doet']}
          rows={[
            ['Pansa-medewerkers (/admin)', 'Bestaat', 'Rollen super_admin, hr_staff en recruiter.'],
            ['Klantportaal (/client)', 'Bestaat', 'De klant ziet alleen profielen die HR deelt, geeft feedback en vraagt vacatures aan.'],
            ['Kandidaatportaal (/candidate)', 'Deels', 'Eigen status en gegevens. Een kandidaat-account aanmaken kan nergens in de app.'],
            ['Extern recruiter of consultant', 'Ontbreekt', 'Geen rol en geen login. De rol recruiter is een interne medewerker.'],
          ]}
        />

        <h2 className={H2}>Drie logins, één sessie-systeem</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Elke login heeft een eigen pagina, maar de rol in het profiel bepaalt wat je mag. Een klant die /admin opent komt er niet in.
        </p>
        <Figure
          svg={ACCESS_SVG}
          caption="De drie bestaande logins en wat elk ziet. De gestreepte oranje rij is de rol die er niet is."
        />
        <Table
          head={['Rol', 'Login', 'Kan']}
          rows={[
            ['super_admin', '/admin', 'Alles van HR, plus gebruikers en rollen, API-sleutels, webhooks, mail, audit-log en functiecategorieën.'],
            ['hr_staff', '/admin', 'Kandidaten, sollicitaties, interviews, contracten, onboarding, export, klanten en leveranciers.'],
            ['recruiter', '/admin', 'In de code geen verschil met hr_staff. Zelfde schermen en rechten.'],
            ['client', '/client', 'Gedeelde profielen bekijken, feedback geven en vacature-aanvragen met Req#/RFP-ID# indienen.'],
            ['candidate', '/candidate', 'Eigen sollicitatiestatus en contactgegevens, eigen documenten openen.'],
          ]}
        />
        <p className="mt-4 max-w-3xl rounded-r-md border-l-4 border-amber-700 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          In de app zijn <b>companies</b> de eigen bedrijven van Pansa en hebben die geen login. Een <b>client</b> is de externe klant, zoals ZIJIN-RGM, en die heeft het portaal.
          Leveranciers (medisch, uitzendbureau, verzekering) zijn alleen CRM-gegevens zonder login.
        </p>

        <h2 className={H2}>De werkstroom van vraag tot opvolging</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Zes momenten, vier spelers. Het groen omrande pad is het werk van Pansa-staff, de pijlen tussen de banen zijn de overdrachten.
        </p>
        <Figure
          svg={FLOW_SVG}
          caption="Wie wat doet per fase. De klant vraagt aan en geeft feedback, de kandidaat solliciteert en levert aan, Pansa-staff doet het werk ertussen en het systeem bewaakt de data en stuurt mail."
        />

        <h2 className={H2}>De statuspijplijn van één sollicitatie</h2>
        <Figure
          svg={STATUS_SVG}
          caption="Een sollicitatie loopt door zeven statussen. Elke wijziging komt in de audit-trail. Afwijzen of intrekken haalt de kandidaat uit de pijplijn."
        />

        <h2 className={H2}>AI en e-mail</h2>
        <Table
          head={['Onderdeel', 'Status', 'Hoe het nu werkt']}
          rows={[
            ['Chat-support', 'Eenvoudig', 'Publieke chat-widget die vragen beantwoordt uit de kennisbank, in de taal van de bezoeker. Geen inlog, geen opgeslagen gesprekken, geen doorverwijzing naar een mens.'],
            ['RAG', 'Basis', 'Alle actieve kennisbank-items gaan mee in elke vraag. Geen vector-database en geen zoekstap.'],
            ['AI trainen', 'Handmatig', 'Alleen tekstitems toevoegen bij Instellingen, Chat-kennisbank (super_admin). Geen upload van documenten en geen fine-tuning.'],
            ['AI-OCR', 'Bestaat', 'Bij Digitaliseren leest een model een gescand formulier uit. Staff controleert altijd voor het opslaan.'],
            ['AI-agent met handelingen', 'Ontbreekt', 'Het model kan niets in het systeem doen. Er zijn geen tools of acties.'],
            ['E-mail', 'Code klaar', 'SMTP staat alleen in omgevingsvariabelen. Bij Instellingen, E-mail staan de outbox, opnieuw proberen en een testmail.'],
          ]}
        />

        <h2 className={H2}>Wat er nog moet voor een externe recruiter</h2>
        <p className="mt-2 text-sm text-muted-foreground">Voorstel, nog niet gebouwd.</p>
        <ul className="mt-2 max-w-3xl list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Nieuwe rol external_recruiter met eigen login, gekoppeld aan een bureau of leverancier.</li>
          <li>Een sollicitatie krijgt een veld voor wie hem heeft ingebracht, en de recruiter ziet alleen die dossiers.</li>
          <li>Geen toegang tot klantgegevens, contracten, bankgegevens of kandidaten van anderen.</li>
          <li>Indienen via een eigen formulier, daarna beoordeelt Pansa-staff in dezelfde pijplijn.</li>
          <li>Kandidaat-accounts hebben een uitnodiging nodig. Nu kan HR geen kandidaat-login maken.</li>
        </ul>
      </div>
    </AdminShell>
  )
}
