/**
 * ProfileSketch.tsx
 * WAT:    Detailweergave van één sollicitatie: kandidaatgegevens, documenten en statuspipeline.
 * WAAROM: Server component — data komt al binnen als props, alleen de status-knoppen zijn
 *         interactief (zie StatusActions).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { StatusActions } from '@/components/admin/StatusActions'
import { formatDate } from '@/lib/utils'
import { APPLICATION_STATUS_LABELS, type ApplicationDocument, type ApplicationStatus, type ApplicationWithCandidate } from '@/types/database'

const STATUS_FLOW: ApplicationStatus[] = [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'offer',
  'onboarding',
  'active',
]

const DOCUMENT_LABELS: Record<ApplicationDocument['kind'], string> = {
  cv: 'CV',
  handwritten_scan: 'Scan handgeschreven formulier',
  id_document: 'ID-document',
  certificate: 'Certificaat',
  other: 'Overig',
}

export function ProfileSketch({
  application,
  documents,
}: {
  application: ApplicationWithCandidate
  documents: ApplicationDocument[]
}) {
  const currentIndex = STATUS_FLOW.indexOf(application.status)
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 && application.status !== 'rejected'
    ? STATUS_FLOW[currentIndex + 1]
    : null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {application.candidate.firstName} {application.candidate.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Solliciteert bij {application.company.name} — {application.positionApplied}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="E-mail" value={application.candidate.email} />
              <Field label="Telefoon" value={application.candidate.phone} />
              <Field label="Geboortedatum" value={formatDate(application.candidate.dateOfBirth)} />
              <Field label="ID-nummer" value={application.candidate.idNumber} />
              <Field label="Nationaliteit" value={application.candidate.nationality} />
              <Field label="Jaren ervaring" value={application.candidate.yearsExperience?.toString()} />
              <Field label="Adres" value={application.candidate.address} />
              <Field
                label="Bron"
                value={application.source === 'digitized_paper' ? 'Handgeschreven (gedigitaliseerd)' : 'Online formulier'}
              />
              <Field label="Datum binnengekomen" value={formatDate(application.createdAt)} />
            </dl>

            {application.coverNote && (
              <div className="mt-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motivatie</p>
                <p className="text-sm text-foreground">{application.coverNote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Documenten</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 && <p className="text-sm text-muted-foreground">Geen documenten geüpload.</p>}
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{DOCUMENT_LABELS[doc.kind]}</p>
                    <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                  </div>
                  <Button variant="secondary" render={<a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" />}>
                    Bekijken
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="space-y-2">
              {STATUS_FLOW.map((step, index) => (
                <li key={step} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${index <= currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                  <span className={index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'}>
                    {APPLICATION_STATUS_LABELS[step]}
                  </span>
                </li>
              ))}
            </ol>

            <StatusActions applicationId={application.id} currentStatus={application.status} nextStatus={nextStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || '—'}</dd>
    </div>
  )
}
