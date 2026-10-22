'use client'

/**
 * CandidateEditButton.tsx
 * WAT:    "Bewerken"-knop op de kandidaat-profielpagina: opent het bestaande bewerkpaneel
 *         (CandidateDetailSheet) direct in bewerkmodus en ververst de pagina na opslaan.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CandidateDetailSheet } from '@/components/admin/CandidateDetailSheet'
import type { Candidate } from '@/types/database'

export function CandidateEditButton({ candidate }: { candidate: Candidate }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Bewerken
      </Button>
      {open && (
        <CandidateDetailSheet
          candidate={candidate}
          open={open}
          initialMode="edit"
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) router.refresh()
          }}
        />
      )}
    </>
  )
}
