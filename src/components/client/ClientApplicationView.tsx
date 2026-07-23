import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ClientFeedbackForm } from '@/components/client/ClientFeedbackForm'
import { formatDate } from '@/lib/utils'
import type { SharedApplication } from '@/types/database'

export function ClientApplicationView({ application }: { application: SharedApplication }) {
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
