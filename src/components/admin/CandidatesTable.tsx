import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { Candidate } from '@/types/database'

export function CandidatesTable({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Telefoon</TableHead>
            <TableHead>Nationaliteit</TableHead>
            <TableHead>Geregistreerd</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                Geen kandidaten gevonden.
              </TableCell>
            </TableRow>
          )}
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium text-foreground">
                {candidate.firstName} {candidate.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{candidate.email || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{candidate.phone || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{candidate.nationality || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(candidate.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
