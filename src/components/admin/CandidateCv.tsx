/**
 * CandidateCv.tsx
 * WAT:    Printbare CV-weergave in het Pansa-huisstijl-format, gebaseerd op het echte
 *         CV-sjabloon (`.claude/skills/pansa-ats-process/references/cv-template.md`).
 * WAAROM: Server component — puur presentatie, geen interactie nodig. Printen/PDF gaat via
 *         de browser (window.print), getriggerd door een client-knop op de CV-pagina.
 */

import { formatDate } from '@/lib/utils'
import type { ApplicationWithCandidate } from '@/types/database'

export function CandidateCv({ application }: { application: ApplicationWithCandidate }) {
  const { candidate } = application

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-card print:border-0 print:shadow-none">
      <header className="bg-primary px-8 py-6 text-primary-foreground">
        <p className="text-xs font-medium uppercase tracking-widest opacity-80">{application.company.name}</p>
        {application.company.kind === 'subsidiary' && (
          <p className="text-[11px] opacity-60">Onderdeel van Pansa Group of Companies N.V.</p>
        )}
        <h1 className="font-heading text-4xl font-semibold tracking-wide">Curriculum Vitae</h1>
        <p className="mt-1 text-lg">
          {candidate.firstName} {candidate.lastName}
        </p>
      </header>

      <div className="space-y-8 px-8 py-6">
        <section>
          <SectionTitle>Persoonsgegevens</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <CvField label="Functie" value={application.positionApplied} />
            <CvField label="Bedrijf" value={application.company.name} />
            <CvField label="ID-nummer" value={candidate.idNumber} />
            <CvField label="Geslacht" value={GENDER_LABELS[candidate.gender ?? '']} />
            <CvField label="Geboortedatum" value={formatDate(candidate.dateOfBirth)} />
            <CvField label="Geboorteplaats" value={candidate.birthPlace} />
            <CvField label="Adres" value={candidate.address} />
            <CvField label="Woonplaats" value={candidate.residence} />
            <CvField label="District" value={candidate.district} />
            <CvField label="Nationaliteit" value={candidate.nationality} />
            <CvField label="Categorie rijbewijs" value={candidate.driversLicenseCategory} />
            <CvField label="Datum bewijs goed gedrag" value={formatDate(candidate.policeClearanceDate)} />
            <CvField
              label="Familielid bij Pansa Group/HPS"
              value={
                candidate.relatedToStaffMember === null
                  ? undefined
                  : candidate.relatedToStaffMember
                    ? `Ja — ${candidate.relatedToStaffMemberDetails || ''}`
                    : 'Nee'
              }
            />
          </dl>
        </section>

        {candidate.education.length > 0 && (
          <section>
            <SectionTitle>Opleiding &amp; training</SectionTitle>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Opleidingsniveau</th>
                  <th className="py-1.5 pr-3 font-medium">Studierichting</th>
                  <th className="py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidate.education.map((entry, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3 text-foreground">{entry.level}</td>
                    <td className="py-1.5 pr-3 text-foreground">{entry.fieldOfStudy || '—'}</td>
                    <td className="py-1.5 text-muted-foreground">{entry.completed ? 'Afgerond' : 'Niet afgerond'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {candidate.priorTrainings.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-foreground">
                {candidate.priorTrainings.map((entry, i) => (
                  <li key={i}>
                    {entry.title}
                    {entry.kind ? ` (${entry.kind})` : ''}
                    {entry.period ? ` — ${entry.period}` : ''}
                    <span className="text-muted-foreground"> · {entry.completed ? 'afgerond' : 'niet afgerond'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {candidate.workHistory.length > 0 && (
          <section>
            <SectionTitle>Werkervaring</SectionTitle>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Periode</th>
                  <th className="py-1.5 pr-3 font-medium">Bedrijf</th>
                  <th className="py-1.5 font-medium">Functie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidate.workHistory.map((entry, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3 whitespace-nowrap text-foreground">{entry.period || '—'}</td>
                    <td className="py-1.5 pr-3 text-foreground">{entry.company}</td>
                    <td className="py-1.5 text-foreground">{entry.role || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {candidate.personalCompetencies && (
          <section>
            <SectionTitle>Persoonlijke competenties</SectionTitle>
            <p className="text-sm text-foreground">{candidate.personalCompetencies}</p>
          </section>
        )}

        {candidate.languageSkills && (
          <section>
            <SectionTitle>Taalvaardigheid</SectionTitle>
            <p className="text-sm text-foreground">{candidate.languageSkills}</p>
          </section>
        )}
      </div>

      <footer className="border-t border-border px-8 py-4 text-xs text-muted-foreground">
        Gegenereerd op {formatDate(new Date().toISOString())} — Pansa ATS
      </footer>
    </div>
  )
}

const GENDER_LABELS: Record<string, string> = { man: 'Man', vrouw: 'Vrouw' }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-border pb-1 font-heading text-lg font-semibold tracking-wide text-primary">
      {children}
    </h2>
  )
}

function CvField({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === '—') return null
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}
