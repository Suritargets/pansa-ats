'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CandidateDetailSheet } from '@/components/admin/CandidateDetailSheet'
import { formatDate } from '@/lib/utils'
import type { Candidate } from '@/types/database'

export function CandidatesTable({ candidates }: { candidates: Candidate[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = candidates.find((c) => c.id === selectedId) ?? null

  // Blijft de laatst geopende kandidaat tonen terwijl het paneel dichtschuift
  // (selectedId is dan al leeg, maar de content moet nog even zichtbaar blijven).
  const [lastSelected, setLastSelected] = useState<Candidate | null>(null)
  if (selected && selected !== lastSelected) {
    setLastSelected(selected)
  }

  return (
    <>
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
              <TableRow
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
                className="cursor-pointer"
              >
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

      {lastSelected && (
        <CandidateDetailSheet
          key={lastSelected.id}
          candidate={lastSelected}
          open={selectedId !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
        />
      )}
    </>
  )
}
