'use client'

/**
 * DocumentUploadForm.tsx
 * WAT:    Staff voegt een document toe aan het personeelsdossier (medische keuring, SOR-verklaring,
 *         getekende arbeidsovereenkomst, rijbewijs, ...) — kiest het documenttype en het bestand.
 * WAAROM: Zonder dit konden alleen de sollicitatieformulieren documenten toevoegen; de Index
 *         Personeelsdossier (PGC-HR-F-0508-04) vraagt ook stukken die pas ná aanname binnenkomen.
 */

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { uploadApplicationDocument } from '@/services/applications'
import { DOCUMENT_LABELS } from '@/lib/dossier'
import type { DocumentKind } from '@/types/database'

const KIND_ORDER: DocumentKind[] = [
  'medical_certificate',
  'sor_declaration',
  'medical_insurance',
  'signed_contract',
  'police_clearance',
  'id_document',
  'drivers_license',
  'diploma',
  'certificate',
  'photo_family_docs',
  'cv',
  'other',
]

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function DocumentUploadForm({
  applicationId,
  defaultKind = 'medical_certificate',
}: {
  applicationId: string
  defaultKind?: DocumentKind
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [kind, setKind] = useState<DocumentKind>(defaultKind)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setMessage({ ok: false, text: 'Kies eerst een bestand.' })
      return
    }
    setMessage(null)
    startTransition(async () => {
      // Staff-sessie volstaat; het uploadToken is alleen voor de publieke sollicitatie.
      const result = await uploadApplicationDocument(applicationId, file, kind, '')
      if (!result.success) {
        setMessage({ ok: false, text: result.error })
        return
      }
      setMessage({ ok: true, text: `${DOCUMENT_LABELS[kind]} toegevoegd.` })
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Document toevoegen aan dossier</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="document-kind">Type document</Label>
          <select
            id="document-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as DocumentKind)}
            className={selectClasses}
          >
            {KIND_ORDER.map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="document-file">Bestand (JPG, PNG, WEBP of PDF, max 8MB)</Label>
          <input
            id="document-file"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-2.5 file:py-1 file:text-sm"
          />
        </div>
      </div>
      {message && (
        <Alert variant={message.ok ? 'default' : 'destructive'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Uploaden...' : 'Uploaden'}
      </Button>
    </form>
  )
}
