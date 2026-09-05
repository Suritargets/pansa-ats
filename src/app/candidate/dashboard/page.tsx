import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnApplicationForCandidate, listApplicationDocuments, listInterviews } from '@/services/queries'
import { CandidateShell } from '@/components/candidate/CandidateShell'
import { ProgressDashboard } from '@/components/candidate/ProgressDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { daysSince, formatDate } from '@/lib/utils'
import { DOCUMENT_LABELS } from '@/types/database'

export default async function CandidateDashboardPage() {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const application = await getOwnApplicationForCandidate(session.candidateId)
  const interviews = application ? await listInterviews(application.id) : []
  const documents = application ? await listApplicationDocuments(application.id) : []

  const daysSinceApplied = application ? daysSince(application.createdAt) : 0

  return (
    <CandidateShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Mijn sollicitatie</h1>

      {!application && <p className="text-sm text-muted-foreground">Er is nog geen sollicitatie gevonden.</p>}

      {application && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{application.positionApplied}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bij {application.company.name} — gesolliciteerd op {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>
            </CardHeader>
          </Card>

          <ProgressDashboard status={application.status} daysSinceApplied={daysSinceApplied} interviewCount={interviews.length} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Mijn documenten</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen documenten geüpload.</p>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </CandidateShell>
  )
}
