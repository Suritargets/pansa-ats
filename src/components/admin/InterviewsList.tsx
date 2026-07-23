import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { Interview, InterviewType } from '@/types/database'

const TYPE_LABELS: Record<InterviewType, string> = {
  general: 'Algemeen gesprek',
  work_experience: 'Werkervaring-gesprek',
  client: 'Klantgesprek',
  medical: 'Medische keuring',
  second_terms: 'Tweede gesprek',
}

export function InterviewsList({ interviews }: { interviews: Interview[] }) {
  if (interviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen interviews vastgelegd.</p>
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => (
        <Card key={interview.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{TYPE_LABELS[interview.type]}</CardTitle>
              <span className="text-xs text-muted-foreground">{formatDate(interview.conductedAt)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {interview.averageScore && (
              <p className="text-sm text-foreground">
                Score: <span className="font-medium">{interview.averageScore}</span> (totaal {interview.totalScore})
              </p>
            )}
            {interview.notes && <p className="text-sm text-muted-foreground">{interview.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
