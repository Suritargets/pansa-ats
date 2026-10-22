/**
 * DossierTab.tsx
 * WAT:    Tab "Dossier": de Index Personeelsdossier (PGC-HR-F-0508-04, 11 onderdelen) met status per
 *         onderdeel, het "client pre-employment"-pakket (4 stukken die de client eist vóór de
 *         inductie), en een uploadformulier voor ontbrekende stukken.
 * WAAROM: HR moet de index wekelijks bijhouden en het pre-employment pakket vóór de start- en
 *         inductiedatum naar de client mailen (PGC-HR-PR-0501-05). Alles hier is berekend uit
 *         bestaande data (zie lib/dossier.ts) — niets wordt dubbel ingevoerd.
 */

import Link from 'next/link'
import { CheckCircle2, Circle, CircleDashed, CircleSlash, Printer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentUploadForm } from '@/components/admin/DocumentUploadForm'
import { formatDate } from '@/lib/utils'
import type { DossierItem, DossierState, PreEmploymentItem } from '@/lib/dossier'

const STATE_ICON: Record<DossierState, typeof Circle> = {
  done: CheckCircle2,
  partial: CircleDashed,
  missing: Circle,
  not_applicable: CircleSlash,
}

const STATE_LABEL: Record<DossierState, string> = {
  done: 'Aanwezig',
  partial: 'Gedeeltelijk',
  missing: 'Ontbreekt',
  not_applicable: 'N.v.t.',
}

const STATE_COLOR: Record<DossierState, string> = {
  done: 'text-primary',
  partial: 'text-amber-600 dark:text-amber-400',
  missing: 'text-muted-foreground',
  not_applicable: 'text-muted-foreground',
}

export function DossierTab({
  applicationId,
  items,
  preEmployment,
}: {
  applicationId: string
  items: DossierItem[]
  preEmployment: { items: PreEmploymentItem[]; ready: boolean }
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Client pre-employment</CardTitle>
            <Badge variant={preEmployment.ready ? 'default' : 'outline'}>
              {preEmployment.ready ? 'Compleet voor client' : 'Nog niet compleet'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Vereist om client induction training aan te vragen (medical certificate, SOR, valid police clearance,
            valid identification).
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {preEmployment.items.map((item) => {
              const Icon = item.state === 'done' ? CheckCircle2 : Circle
              return (
                <li key={item.title} className="flex items-start gap-2 text-sm">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${item.state === 'done' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-foreground">{item.title}</p>
                    {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Index personeelsdossier</CardTitle>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/applications/${applicationId}/dossier`} target="_blank" />}
            >
              <Printer className="size-4" />
              Index afdrukken
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">PGC-HR-F-0508-04 — wekelijks bijhouden.</p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {items.map((item) => (
              <DossierRow key={item.no} item={item} />
            ))}
          </ol>
        </CardContent>
      </Card>

      <DocumentUploadForm applicationId={applicationId} />
    </div>
  )
}

function DossierRow({ item }: { item: DossierItem }) {
  const Icon = STATE_ICON[item.state]
  return (
    <li>
      <div className="flex items-start gap-2 text-sm">
        <Icon className={`mt-0.5 size-4 shrink-0 ${STATE_COLOR[item.state]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-foreground">
            {item.no && <span className="mr-1.5 text-muted-foreground">{item.no}.</span>}
            {item.title}
          </p>
          {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <p>{STATE_LABEL[item.state]}</p>
          {item.date && <p>{formatDate(item.date)}</p>}
        </div>
      </div>
      {item.children && (
        <ul className="mt-1.5 ml-6 space-y-1.5 border-l border-border pl-3">
          {item.children.map((child) => {
            const ChildIcon = STATE_ICON[child.state]
            return (
              <li key={child.title} className="flex items-start gap-2 text-sm">
                <ChildIcon className={`mt-0.5 size-3.5 shrink-0 ${STATE_COLOR[child.state]}`} />
                <p className="flex-1 text-foreground">
                  {child.title}
                  {child.hint && <span className="ml-1 text-xs text-muted-foreground">({child.hint})</span>}
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">{child.date ? formatDate(child.date) : ''}</p>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
