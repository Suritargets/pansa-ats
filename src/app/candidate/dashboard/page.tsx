import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnApplicationForCandidate } from '@/services/queries'
import { CandidateShell } from '@/components/candidate/CandidateShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { APPLICATION_STATUS_LABELS } from '@/types/database'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types/database'

const STATUS_FLOW: ApplicationStatus[] = [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'offer',
  'onboarding',
  'active',
]

export default async function CandidateDashboardPage() {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const application = await getOwnApplicationForCandidate(session.candidateId)

  return (
    <CandidateShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Mijn sollicitatie</h1>

      {!application && <p className="text-sm text-muted-foreground">Er is nog geen sollicitatie gevonden.</p>}

      {application && (
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
          <CardContent>
            <ol className="space-y-2">
              {STATUS_FLOW.map((step, index) => {
                const currentIndex = STATUS_FLOW.indexOf(application.status)
                return (
                  <li key={step} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${index <= currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                    <span className={index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'}>
                      {APPLICATION_STATUS_LABELS[step]}
                    </span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </CandidateShell>
  )
}
