/**
 * admin/applications/[id]/dossier/page.tsx
 * WAT:    Printbare "Index Personeelsdossier" (PGC-HR-F-0508-04) voor één medewerker: de 11 onderdelen
 *         met een DATUM-kolom, zoals het papieren formulier.
 * WAAROM: Het procesdocument eist dat de index wekelijks wordt bijgehouden; deze pagina vult de
 *         datums in uit wat al in het systeem staat, zodat HR hem alleen nog hoeft af te drukken.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { loadDossierData } from '@/services/dossier'
import { PrintButton } from '@/components/admin/PrintButton'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { registrationLabel } from '@/lib/registration'

export default async function DossierIndexPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession([...STAFF_ROLES])
  const { id } = await params

  const data = await loadDossierData(id)
  if (!data) notFound()
  const { application, items } = data
  const { candidate } = application

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/applications/${application.id}`} />}>
          <ArrowLeft className="size-4" />
          Terug naar profiel
        </Button>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-10 text-sm text-black print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="mb-6 flex items-start justify-between border-b border-black pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-wide">INDEX PERSONEELSDOSSIER</h1>
            <p className="text-xs">CCC H. Pansa &amp; Sons N.V. — PGC-HR-F-0508-04</p>
          </div>
          <div className="text-right text-xs">
            <p>Afgedrukt: {formatDate(new Date())}</p>
          </div>
        </header>

        <dl className="mb-6 grid grid-cols-3 gap-4 text-xs">
          <div>
            <dt className="uppercase text-black/60">Medewerker</dt>
            <dd className="font-medium">
              {candidate.lastName}, {candidate.firstName}
            </dd>
          </div>
          <div>
            <dt className="uppercase text-black/60">Registratienr</dt>
            <dd className="font-medium">{registrationLabel(candidate)}</dd>
          </div>
          <div>
            <dt className="uppercase text-black/60">Functie</dt>
            <dd className="font-medium">{application.positionApplied}</dd>
          </div>
        </dl>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black text-xs uppercase">
              <th className="w-10 py-1.5 pr-2 font-semibold">#</th>
              <th className="py-1.5 pr-2 font-semibold">Onderdeel</th>
              <th className="w-28 py-1.5 pr-2 font-semibold">Aanwezig</th>
              <th className="w-28 py-1.5 font-semibold">Datum</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <PrintRows key={item.no} item={item} />
            ))}
          </tbody>
        </table>
      </article>
    </div>
  )
}

const STATE_TEXT = { done: 'Ja', partial: 'Gedeeltelijk', missing: 'Nee', not_applicable: 'N.v.t.' } as const

function PrintRows({ item }: { item: import('@/lib/dossier').DossierItem }) {
  return (
    <>
      <tr className="border-b border-black/20 align-top">
        <td className="py-1.5 pr-2 font-medium">{item.no}.</td>
        <td className="py-1.5 pr-2 font-medium">{item.title}</td>
        <td className="py-1.5 pr-2">{STATE_TEXT[item.state]}</td>
        <td className="py-1.5">{item.date ? formatDate(item.date) : ''}</td>
      </tr>
      {item.children?.map((child) => (
        <tr key={child.title} className="border-b border-black/10 align-top text-[13px]">
          <td />
          <td className="py-1 pl-4 pr-2">{child.title}</td>
          <td className="py-1 pr-2">{STATE_TEXT[child.state]}</td>
          <td className="py-1">{child.date ? formatDate(child.date) : ''}</td>
        </tr>
      ))}
    </>
  )
}
