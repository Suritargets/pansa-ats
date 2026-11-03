'use client'

/**
 * ImportWizard.tsx
 * WAT:    Import van kandidaten, klanten of leveranciers uit CSV/Excel in vier stappen:
 *         bestand → kolommen koppelen → controleren → importeren.
 * WAAROM: Rijen met fouten of dubbelen worden overgeslagen, nooit half geïmporteerd; het voorbeeldbestand
 *         laat de verwachte notatie zien. Excel wordt in de browser gelezen (xlsx, dynamisch geladen).
 */

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { csvToObjects } from '@/lib/csv'
import { IMPORT_ENTITIES, IMPORT_FIELDS, autoMap, exampleCsv, type ImportEntity } from '@/lib/import-fields'
import { runImport, validateImport, type ImportRowResult } from '@/services/import'
import { cn } from '@/lib/utils'

const STEPS = ['Bestand', 'Kolommen koppelen', 'Controleren', 'Klaar']
const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function ImportWizard() {
  const [step, setStep] = useState(0)
  const [entity, setEntity] = useState<ImportEntity>('candidates')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [records, setRecords] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [results, setResults] = useState<ImportRowResult[] | null>(null)
  const [summary, setSummary] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const fields = IMPORT_FIELDS[entity]
  const entityInfo = IMPORT_ENTITIES.find((e) => e.value === entity)!
  const missingRequired = fields.filter((f) => f.required && !mapping[f.key])

  const mappedRows = useMemo(
    () => records.map((r) => Object.fromEntries(fields.map((f) => [f.key, mapping[f.key] ? (r[mapping[f.key]] ?? '') : '']))),
    [records, mapping, fields]
  )

  function downloadExample() {
    const url = URL.createObjectURL(new Blob([exampleCsv(entity)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity}-voorbeeld.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function onFile(file: File) {
    setError(null)
    try {
      let objects: Record<string, string>[]
      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const sheet = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' })
        const [head, ...body] = sheet.map((r) => r.map((c) => String(c ?? '').trim()))
        objects = (body ?? []).filter((r) => r.some(Boolean)).map((r) => Object.fromEntries((head ?? []).map((h, i) => [h, r[i] ?? ''])))
      } else {
        objects = csvToObjects(await file.text())
      }
      const hdrs = objects.length > 0 ? Object.keys(objects[0]).filter(Boolean) : []
      if (hdrs.length === 0 || objects.length === 0) throw new Error('Het bestand bevat geen gegevensrijen.')
      setFileName(file.name)
      setHeaders(hdrs)
      setRecords(objects)
      setMapping(autoMap(hdrs, fields))
      setResults(null)
      setStep(1)
    } catch (e) {
      setError((e as Error).message || 'Het bestand kon niet worden gelezen. Gebruik een CSV- of Excel-bestand (.xlsx).')
    }
  }

  function check() {
    setError(null)
    startTransition(async () => {
      const res = await validateImport(entity, mappedRows)
      if (!res.success) return setError(res.error)
      setResults(res.data)
      setStep(2)
    })
  }

  function doImport() {
    setError(null)
    startTransition(async () => {
      const res = await runImport(entity, mappedRows)
      if (!res.success) return setError(res.error)
      setSummary(res.data)
      setStep(3)
    })
  }

  function restart() {
    setStep(0)
    setRecords([])
    setHeaders([])
    setResults(null)
    setSummary(null)
    setFileName('')
    setError(null)
  }

  const okCount = results?.filter((r) => r.status === 'ok').length ?? 0
  const problems = results?.filter((r) => r.status !== 'ok') ?? []

  return (
    <div className="max-w-4xl space-y-6">
      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              'rounded-full border px-3 py-1',
              i === step ? 'border-primary bg-primary/10 font-medium text-foreground' : i < step ? 'border-border text-foreground' : 'border-border text-muted-foreground'
            )}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="max-w-sm space-y-1.5">
            <label htmlFor="entity" className="text-sm font-medium">
              Wat wil je importeren?
            </label>
            <select id="entity" value={entity} onChange={(e) => setEntity(e.target.value as ImportEntity)} className={selectClasses}>
              {IMPORT_ENTITIES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            Verplichte velden: {fields.filter((f) => f.required).map((f) => f.label).join(', ')}. Rijen met fouten of dubbelen worden overgeslagen, nooit half geïmporteerd.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Upload className="size-4" />
              CSV- of Excel-bestand kiezen
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onFile(f)
                  e.target.value = ''
                }}
              />
            </label>
            <Button type="button" variant="outline" onClick={downloadExample}>
              <Download className="size-4" />
              Voorbeeldbestand
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="size-4 text-muted-foreground" />
            {fileName} · {records.length} rij{records.length === 1 ? '' : 'en'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label htmlFor={`map-${f.key}`} className="text-sm font-medium">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </label>
                <select
                  id={`map-${f.key}`}
                  value={mapping[f.key] ?? ''}
                  onChange={(e) => {
                    const next = { ...mapping }
                    if (e.target.value) next[f.key] = e.target.value
                    else delete next[f.key]
                    setMapping(next)
                  }}
                  className={selectClasses}
                >
                  <option value="">— niet importeren —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {missingRequired.length > 0 && (
            <p className="text-sm text-destructive">Koppel nog: {missingRequired.map((f) => f.label).join(', ')}</p>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={restart}>
              <ArrowLeft className="size-4" />
              Ander bestand
            </Button>
            <Button onClick={check} disabled={pending || missingRequired.length > 0}>
              {pending ? 'Bezig...' : 'Controleren'}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && results && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[var(--color-brand-green)]" />
              {okCount} klaar om te importeren
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-500" />
              {problems.length} overgeslagen
            </span>
          </div>

          {problems.length > 0 && (
            <div className="max-h-72 overflow-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rij</TableHead>
                    <TableHead>Reden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.slice(0, 200).map((r) => (
                    <TableRow key={r.row}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell>{r.messages.join('; ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {problems.length > 200 && <p className="p-2 text-xs text-muted-foreground">En nog {problems.length - 200} rijen.</p>}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" />
              Terug
            </Button>
            <Button onClick={doImport} disabled={pending || okCount === 0}>
              {pending ? 'Bezig...' : `${okCount} importeren`}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && summary && (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              {summary.imported} {entityInfo.label.toLowerCase()} geïmporteerd{summary.skipped > 0 ? `, ${summary.skipped} overgeslagen.` : '.'}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Link href={entityInfo.href} className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Naar {entityInfo.label.toLowerCase()}
            </Link>
            <Button variant="outline" onClick={restart}>
              Nog een bestand
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
