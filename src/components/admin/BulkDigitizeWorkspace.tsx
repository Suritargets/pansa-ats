'use client'

/**
 * BulkDigitizeWorkspace.tsx
 * WAT:    Verwerkt meerdere gescande registratieformulieren in één keer — als bestanden
 *         en/of links (bv. een publiek gedeelde Google Drive-link). Elk item wordt na OCR
 *         apart doorlopen en pas via het gewone ApplicationForm goedgekeurd/opgeslagen —
 *         niets wordt automatisch aangemaakt.
 * WAAROM: Losse client-side wachtrij i.p.v. één server-actie voor alles — geeft voortgang
 *         per item, blijft binnen serverless-tijdslimieten, en hergebruikt het bestaande,
 *         al geverifieerde ApplicationForm voor de daadwerkelijke review/opslag.
 */

import { useState, useTransition } from 'react'
import { CheckCircle2, Link as LinkIcon, Loader2, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApplicationForm, type ApplicationFormValues } from '@/components/candidate/ApplicationForm'
import { extractRegistrationForm, extractRegistrationFormFromUrl } from '@/services/ocr'
import { mapOcrResultToFormValues } from '@/lib/ocr-mapping'
import { cn } from '@/lib/utils'
import type { Company, JobCategory } from '@/types/database'

interface QueueItem {
  id: string
  label: string
  source: { type: 'file'; file: File } | { type: 'url'; url: string }
  status: 'pending' | 'extracting' | 'ready' | 'error' | 'saved'
  ocrData?: Partial<ApplicationFormValues>
  scanFile?: File | null
  error?: string
}

let nextId = 0
function newId() {
  nextId += 1
  return `item-${nextId}`
}

export function BulkDigitizeWorkspace({ companies, jobCategories }: { companies: Company[]; jobCategories: JobCategory[] }) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Verhoogd bij elk geselecteerd item zodat <ApplicationForm key={reviewKey}> remount i.p.v.
  // een effect om nieuwe ocrData/initialScanFile props te syncen.
  const [reviewKey, setReviewKey] = useState(0)

  function addFiles(files: FileList | null) {
    if (!files) return
    const items: QueueItem[] = Array.from(files).map((file) => ({
      id: newId(),
      label: file.name,
      source: { type: 'file', file },
      status: 'pending',
    }))
    setQueue((q) => [...q, ...items])
  }

  function addLink() {
    const url = linkInput.trim()
    if (!url) return
    setQueue((q) => [...q, { id: newId(), label: url, source: { type: 'url', url }, status: 'pending' }])
    setLinkInput('')
  }

  function removeItem(id: string) {
    setQueue((q) => q.filter((item) => item.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function selectItem(id: string) {
    setSelectedId(id)
    setReviewKey((k) => k + 1)
  }

  function runQueue() {
    startTransition(async () => {
      // Sequentieel — voorkomt dat een batch van 20 scans tegelijk de AI Gateway/rate limits raakt.
      for (const item of queue) {
        if (item.status !== 'pending') continue

        setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: 'extracting' } : i)))

        const result =
          item.source.type === 'file' ? await extractRegistrationForm(item.source.file) : await extractRegistrationFormFromUrl(item.source.url)

        setQueue((q) =>
          q.map((i) => {
            if (i.id !== item.id) return i
            if (!result.success) return { ...i, status: 'error', error: result.error }
            return {
              ...i,
              status: 'ready',
              ocrData: mapOcrResultToFormValues(result.data, companies, jobCategories),
              scanFile: item.source.type === 'file' ? item.source.file : null,
            }
          })
        )
      }
    })
  }

  function markSaved(id: string) {
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, status: 'saved' } : i)))
    setSelectedId(null)
    const next = queue.find((i) => i.id !== id && i.status === 'ready')
    if (next) selectItem(next.id)
  }

  const selectedItem = queue.find((i) => i.id === selectedId) ?? null
  const pendingCount = queue.filter((i) => i.status === 'pending').length
  const readyCount = queue.filter((i) => i.status === 'ready').length

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <Label>Bestanden toevoegen</Label>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            className="mt-2 block text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80"
          />
        </div>
        <div>
          <Label htmlFor="linkInput">Of een link toevoegen (bv. een publiek gedeelde Google Drive-link)</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="linkInput"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="max-w-md"
            />
            <Button type="button" variant="outline" onClick={addLink} disabled={!linkInput.trim()}>
              <LinkIcon className="size-4" />
              Toevoegen
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            De link moet &quot;voor iedereen met de link&quot; gedeeld zijn — er wordt geen Google-account gekoppeld.
          </p>
        </div>

        {queue.length > 0 && (
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Button type="button" onClick={runQueue} disabled={isPending || pendingCount === 0}>
              {isPending ? 'Bezig met uitlezen...' : `OCR starten (${pendingCount} wachtend)`}
            </Button>
            {readyCount > 0 && <span className="text-sm text-muted-foreground">{readyCount} klaar voor review</span>}
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <ul className="divide-y divide-border">
            {queue.map((item) => (
              <li
                key={item.id}
                className={cn('flex items-center justify-between gap-3 px-3 py-2.5 text-sm', item.id === selectedId && 'bg-muted')}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <QueueStatusIcon status={item.status} />
                  <span className="truncate text-foreground">{item.label}</span>
                  {item.ocrData && (item.ocrData.firstName || item.ocrData.lastName) && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      — {item.ocrData.firstName} {item.ocrData.lastName}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.status === 'ready' && (
                    <Button type="button" size="sm" variant={item.id === selectedId ? 'default' : 'outline'} onClick={() => selectItem(item.id)}>
                      Bewerken &amp; goedkeuren
                    </Button>
                  )}
                  {item.status === 'error' && (
                    <span className="text-xs text-destructive">{item.error}</span>
                  )}
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeItem(item.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedItem && (
        <div className="space-y-3">
          <Alert>
            <AlertDescription>
              Controleer en corrigeer alle velden van <strong>{selectedItem.label}</strong> voordat je opslaat.
            </AlertDescription>
          </Alert>
          <ApplicationForm
            key={reviewKey}
            mode="digitize"
            companies={companies}
            jobCategories={jobCategories}
            ocrData={selectedItem.ocrData}
            initialScanFile={selectedItem.scanFile}
            onSaved={() => markSaved(selectedItem.id)}
          />
        </div>
      )}
    </div>
  )
}

function QueueStatusIcon({ status }: { status: QueueItem['status'] }) {
  if (status === 'extracting') return <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
  if (status === 'ready') return <CheckCircle2 className="size-4 shrink-0 text-primary" />
  if (status === 'error') return <XCircle className="size-4 shrink-0 text-destructive" />
  if (status === 'saved') return <CheckCircle2 className="size-4 shrink-0 text-primary" />
  return <span className="size-4 shrink-0 rounded-full border border-muted-foreground/40" />
}
