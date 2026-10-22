/**
 * admin/applications/[id]/contract/page.tsx
 * WAT:    Printbare, vooringevulde Arbeidsovereenkomst voor bepaalde tijd (PGC-HR-F-0513-05, ZIJIN-RGM)
 *         voor één contractstadium. Standalone (buiten AdminShell) zodat de sidebar niet meeprint.
 * WAAROM: HR maakte de AO tot nu toe met de hand in Word. De tekst komt letterlijk uit het sjabloon
 *         (src/constants/employment-contract-text.ts); alleen de invulplaatsen komen uit de data.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getApplicationById, listContracts } from '@/services/queries'
import { buildEmploymentContract, contractDurationMonths } from '@/constants/employment-contract-text'
import { PrintButton } from '@/components/admin/PrintButton'
import { Button } from '@/components/ui/button'

const STAGE_LABELS = {
  probation_2m: 'Proeftijd (2 maanden)',
  term_4m: 'Termijn (4 maanden)',
  extension_6m: 'Verlenging (6 maanden)',
  extension_12m: 'Verlenging (12 maanden)',
  permanent: 'Vast',
} as const

export default async function EmploymentContractPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ contractId?: string }>
}) {
  await requireSession([...STAFF_ROLES])
  const { id } = await params
  const { contractId } = await searchParams

  const application = await getApplicationById(id)
  if (!application) notFound()

  const contracts = await listContracts(id)
  const contract = contractId ? contracts.find((c) => c.id === contractId) : contracts[0]

  const { candidate } = application
  const document = buildEmploymentContract({
    employeeName: `${candidate.lastName}, ${candidate.firstName}`,
    birthDate: candidate.dateOfBirth,
    birthPlace: candidate.birthPlace,
    idNumber: candidate.idNumber,
    address: candidate.address,
    residence: candidate.residence,
    jobTitle: application.positionApplied,
    jobLevel: contract?.jobLevel,
    department: contract?.department,
    startDate: contract?.startDate,
    endDate: contract?.endDate,
    hourlyWageUsd: contract?.hourlyWage,
  })

  const warnings: string[] = []
  if (!contract) warnings.push('Er is nog geen contractstadium vastgelegd — start/einddatum, uurloon, afdeling en level staan open.')
  else {
    if (!contract.startDate || !contract.endDate) warnings.push('Start- of einddatum ontbreekt: artikel 2 gebruikt de standaardtekst "zes (6) maanden".')
    else if (contractDurationMonths(contract.startDate, contract.endDate) === null)
      warnings.push('De periode tussen start- en einddatum is geen heel aantal maanden: artikel 2 gebruikt de standaardtekst "zes (6) maanden".')
    if (!contract.hourlyWage) warnings.push('Uurloon (USD) ontbreekt.')
    if (!contract.department || !contract.jobLevel) warnings.push('Afdeling en/of level ontbreken (artikel 1).')
    if (contract.stage !== 'probation_2m')
      warnings.push(
        'Dit sjabloon is het standaardcontract (proeftijd 2 maanden, voor bepaalde tijd). Controleer artikel 2 handmatig voor het stadium "' +
          STAGE_LABELS[contract.stage] +
          '" voordat je het laat tekenen.'
      )
  }
  if (!candidate.idNumber || !candidate.address) warnings.push('ID-nummer en/of adres van de kandidaat ontbreken.')

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 max-w-3xl space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/applications/${application.id}`} />}>
            <ArrowLeft className="size-4" />
            Terug naar profiel
          </Button>
          <PrintButton />
        </div>
        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">
            <p className="mb-1 flex items-center gap-1.5 font-medium">
              <TriangleAlert className="size-4" />
              Controleer vóór afdrukken
            </p>
            <ul className="list-disc space-y-0.5 pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <article className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-10 text-[13px] leading-relaxed text-black print:max-w-none print:rounded-none print:border-0 print:p-0 print:text-[11pt]">
        <p className="mb-6 border-b border-black/30 pb-2 text-center text-[10px] uppercase tracking-wide">
          {document.employerHeader}
        </p>
        <h1 className="text-center text-xl font-bold tracking-wide">{document.title}</h1>
        <p className="mb-6 text-center font-semibold">{document.subtitle}</p>

        <div className="space-y-2">
          {document.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        {document.articles.map((article) => (
          <section key={article.heading} className="mt-5 break-inside-avoid-page">
            <h2 className="font-bold">{article.heading}</h2>
            <div className="mt-1 space-y-1.5">
              {article.paragraphs.map((paragraph) =>
                paragraph.kind === 'li' ? (
                  <p key={paragraph.text} className="pl-6">
                    – {paragraph.text}
                  </p>
                ) : (
                  <p key={paragraph.text}>{paragraph.text}</p>
                )
              )}
            </div>
          </section>
        ))}

        <p className="mt-8">{document.closing}</p>

        <div className="mt-10 grid grid-cols-2 gap-10 break-inside-avoid">
          <div className="space-y-1">
            <p className="font-semibold">{document.signatures.employer[0]}</p>
            <div className="h-16" />
            <p>{document.signatures.employer[1]}</p>
            <p>{document.signatures.employer[2]}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">{document.signatures.employee[0]}</p>
            <div className="h-16" />
            <p>{document.signatures.employee[1]}</p>
          </div>
        </div>

        <p className="mt-10 text-[9px] text-black/50">Arbeidsovereenkomst voor bepaalde tijd hps RGM / PGC-HR-F-0513-05</p>
      </article>
    </div>
  )
}
