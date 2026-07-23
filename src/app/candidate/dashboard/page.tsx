import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnApplicationForCandidate, listInterviews } from '@/services/queries'
import { CandidateShell } from '@/components/candidate/CandidateShell'
import { ProgressDashboard } from '@/components/candidate/ProgressDashboard'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { daysSince, formatDate } from '@/lib/utils'

export default async function CandidateDashboardPage() {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const application = await getOwnApplicationForCandidate(session.candidateId)
  const interviews = application ? await listInterviews(application.id) : []

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
        </div>
      )}
    </CandidateShell>
  )
}
