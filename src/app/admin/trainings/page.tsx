import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { listAllTrainingProgress, listTrainings } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { TrainingForm } from '@/components/admin/TrainingForm'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TrainingProgressStatus } from '@/types/database'

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
  not_started: 'Nog niet gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  failed: 'Niet gehaald',
}

export default async function TrainingsPage() {
  const session = await requireSession([...STAFF_ROLES])
  const [trainings, progress] = await Promise.all([listTrainings(), listAllTrainingProgress()])

  return (
    <AdminShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Trainingen</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Catalogus ({trainings.length})
          </h2>
          <ul className="mb-6 space-y-2">
            {trainings.length === 0 && <p className="text-sm text-muted-foreground">Nog geen trainingen.</p>}
            {trainings.map((t) => (
              <li key={t.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{t.title}</p>
                {t.standard && <p className="text-xs text-muted-foreground">{t.standard}</p>}
              </li>
            ))}
          </ul>
          <TrainingForm />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Voortgang per kandidaat
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kandidaat</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      Nog geen voortgang geregistreerd.
                    </TableCell>
                  </TableRow>
                )}
                {progress.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/applications/${p.applicationId}`} className="font-medium text-foreground hover:underline">
                        {p.application.candidate.firstName} {p.application.candidate.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.training.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{STATUS_LABELS[p.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
