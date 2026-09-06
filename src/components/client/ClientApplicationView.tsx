import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ClientFeedbackForm } from '@/components/client/ClientFeedbackForm'
import { formatDate } from '@/lib/utils'
import { DOCUMENT_LABELS } from '@/lib/documents'
import type { ApplicationDocument, SharedApplication } from '@/types/database'

export function ClientApplicationView({
  application,
  documents,
}: {
  application: SharedApplication
  documents: ApplicationDocument[]
}) {
  return (
    <div className="space-y-6">
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
            <Field label="Nationaliteit" value={application.candidate.nationality} />
            <Field label="Jaren ervaring" value={application.candidate.yearsExperience?.toString()} />
            <Field label="Gedeeld op" value={formatDate(application.share.sharedAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Documenten</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen documenten beschikbaar.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{DOCUMENT_LABELS[doc.kind]}</p>
                    <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                  </div>
                  <Button
                    variant="secondary"
                    render={<a href={`/api/client/documents/${doc.id}`} target="_blank" rel="noreferrer" />}
                  >
                    Bekijken
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Uw feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientFeedbackForm applicationId={application.id} initialFeedback={application.share.clientFeedback ?? ''} />
        </CardContent>
      </Card>
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
