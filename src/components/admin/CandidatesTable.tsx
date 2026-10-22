'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { CandidateDetailSheet } from '@/components/admin/CandidateDetailSheet'
import { Avatar } from '@/components/admin/Avatar'
import { formatDate } from '@/lib/utils'
import { registrationLabel } from '@/lib/registration'
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
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/8">
        <Table>
          <TableHeader>
            <TableRow className="text-xs tracking-wider uppercase">
              <TableHead className="w-10">#</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Registratienr</TableHead>
              <TableHead>Telefoon</TableHead>
              <TableHead>Woonplaats</TableHead>
              <TableHead>Geregistreerd</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Geen kandidaten gevonden.
                </TableCell>
              </TableRow>
            )}
            {candidates.map((candidate, i) => {
              const name = `${candidate.firstName} ${candidate.lastName}`
              return (
                <TableRow key={candidate.id} onClick={() => setSelectedId(candidate.id)} className="cursor-pointer">
                  <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <Avatar name={name} size="sm" />
                      <span>
                        <span className="block font-medium text-foreground">{name}</span>
                        <span className="block text-xs text-muted-foreground">{candidate.email || '—'}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{registrationLabel(candidate)}</TableCell>
                  <TableCell className="text-muted-foreground">{candidate.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{candidate.residence || candidate.district || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(candidate.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${name} bekijken`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(candidate.id)
                      }}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
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
