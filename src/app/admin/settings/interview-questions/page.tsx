import { requireSession } from '@/lib/auth'
import { SUPER_ADMIN_ROLES } from '@/lib/roles'
import { listAllInterviewQuestions } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { InterviewQuestionForm } from '@/components/admin/InterviewQuestionForm'
import { InterviewQuestionToggle } from '@/components/admin/InterviewQuestionToggle'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { InterviewType } from '@/types/database'

const TYPE_LABELS: Record<InterviewType, string> = {
  general: 'Algemeen',
  work_experience: 'Werkervaring',
  client: 'Klantgesprek',
  medical: 'Medische keuring',
  second_terms: 'Tweede gesprek',
}

export default async function InterviewQuestionsSettingsPage() {
  const session = await requireSession([...SUPER_ADMIN_ROLES])
  const questions = await listAllInterviewQuestions()

  return (
    <AdminShell session={session}>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Interviewvragen ({questions.length})</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Deze vragenbank stuurt het interview-formulier op de sollicitatiedetailpagina aan. Later ook de bron voor
        een sollicitatie-chatwidget op de publieke website.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Vraag</TableHead>
                <TableHead>Volgorde</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Geen interviewvragen.
                  </TableCell>
                </TableRow>
              )}
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Badge variant="outline">{TYPE_LABELS[q.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {q.text}
                    {q.category && <span className="ml-1 text-xs text-muted-foreground">({q.category})</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{q.stepOrder}</TableCell>
                  <TableCell>
                    <Badge variant={q.active ? 'default' : 'secondary'}>{q.active ? 'Actief' : 'Inactief'}</Badge>
                  </TableCell>
                  <TableCell>
                    <InterviewQuestionToggle id={q.id} active={q.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <InterviewQuestionForm />
      </div>
    </AdminShell>
  )
}
