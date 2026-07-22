/**
 * ClientApplicationView.tsx
 * WAT:    Detailweergave van één gedeelde sollicitatie in het klantportaal — read-only
 *         kandidaatprofiel + statuspipeline + een feedbackveld dat de klant zelf mag invullen.
 * WAAROM: Documenten (CV, ID, scans) worden hier bewust NIET getoond — dat blijft
 *         staff-only via /api/documents/[id].
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ClientFeedbackForm } from '@/components/client/ClientFeedbackForm'
import { formatDate } from '@/lib/utils'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, type SharedApplication } from '@/types/database'

const STATUS_FLOW: ApplicationStatus[] = [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'offer',
  'onboarding',
  'active',
]

export function ClientApplicationView({ application }: { application: SharedApplication }) {
  const currentIndex = STATUS_FLOW.indexOf(application.status)

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
                <p className="text-sm text-muted-foreground">{application.positionApplied}</p>
              </div>
              <StatusBadge status={application.status} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="E-mail" value={application.candidate.email} />
              <Field label="Telefoon" value={application.candidate.phone} />
              <Field label="Jaren ervaring" value={application.candidate.yearsExperience?.toString()} />
              <Field label="Nationaliteit" value={application.candidate.nationality} />
              <Field label="Gedeeld op" value={formatDate(application.share.sharedAt)} />
            </dl>

            {application.candidate.skills.length > 0 && (
              <div className="mt-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vaardigheden</p>
                <p className="text-sm text-foreground">{application.candidate.skills.join(', ')}</p>
              </div>
            )}

            {application.candidate.certifications.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Certificaten</p>
                <p className="text-sm text-foreground">{application.candidate.certifications.join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Uw feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientFeedbackForm applicationId={application.id} initialFeedback={application.share.clientFeedback} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Voortgang</CardTitle>
          </CardHeader>
          <CardContent>
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
