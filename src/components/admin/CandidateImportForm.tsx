'use client'

/**
 * CandidateImportForm.tsx
 * WAT:    CSV-upload met preview vóór commit — voorkomt dat een foutief bestand direct
 *         tientallen kandidaten aanmaakt.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { csvToObjects } from '@/lib/csv'
import { bulkImportCandidates, type ImportCandidateRow } from '@/services/import'
import type { Company, JobCategory } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface PreviewRow extends ImportCandidateRow {
  valid: boolean
}

export function CandidateImportForm({ companies, jobCategories }: { companies: Company[]; jobCategories: JobCategory[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [jobCategoryId, setJobCategoryId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleFile(file: File) {
    const text = await file.text()
    const objects = csvToObjects(text)
    const parsed: PreviewRow[] = objects.map((obj) => {
      const row: ImportCandidateRow = {
        firstName: obj.firstName ?? obj.voornaam ?? '',
        lastName: obj.lastName ?? obj.achternaam ?? '',
        email: obj.email ?? '',
        phone: obj.phone ?? obj.telefoon ?? '',
        positionApplied: obj.positionApplied ?? obj.functie ?? '',
      }
      return { ...row, valid: Boolean(row.firstName.trim() && row.lastName.trim() && row.positionApplied.trim()) }
    })
    setFileName(file.name)
    setRows(parsed)
    setResult(null)
  }

  function handleImport() {
    setResult(null)
    startTransition(async () => {
      const validRows = rows.filter((r) => r.valid)
      const res = await bulkImportCandidates(companyId, jobCategoryId || null, validRows)
      if (res.success) {
        setResult({ ok: true, message: `${res.data.count} kandidaten geïmporteerd.` })
        setRows([])
        setFileName('')
        router.refresh()
      } else {
        setResult({ ok: false, message: res.error })
      }
    })
  }

  const validCount = rows.filter((r) => r.valid).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        CSV met kolommen <code className="rounded bg-muted px-1">firstName, lastName, email, phone, positionApplied</code>{' '}
        (eerste rij = kolomnamen).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyId">Bedrijf</Label>
          <select id="companyId" className={cn(selectClasses)} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobCategoryId">Standaard functiecategorie (optioneel)</Label>
          <select id="jobCategoryId" className={cn(selectClasses)} value={jobCategoryId} onChange={(e) => setJobCategoryId(e.target.value)}>
            <option value="">Geen</option>
            {jobCategories.map((jc) => (
              <option key={jc.id} value={jc.id}>
                {jc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="csvFile">CSV-bestand</Label>
        <input
          id="csvFile"
          type="file"
          accept=".csv,text/csv"
          className="block text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {result && (
        <Alert variant={result.ok ? 'default' : 'destructive'}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            {fileName}: {rows.length} rijen, <span className="font-medium">{validCount} geldig</span>
            {validCount < rows.length && (
              <span className="text-destructive"> · {rows.length - validCount} ongeldig (rood, wordt overgeslagen)</span>
            )}
          </p>
          <div className="max-h-80 overflow-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Voornaam</TableHead>
                  <TableHead>Achternaam</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefoon</TableHead>
                  <TableHead>Functie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i} className={cn(!row.valid && 'bg-destructive/5')}>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <AlertTriangle className="size-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>{row.firstName || '—'}</TableCell>
                    <TableCell>{row.lastName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{row.phone || '—'}</TableCell>
                    <TableCell>{row.positionApplied || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={handleImport} disabled={isPending || validCount === 0}>
            <Upload className="size-4" />
            {isPending ? 'Bezig...' : `${validCount} kandidaten importeren`}
          </Button>
        </div>
      )}
    </div>
  )
}
