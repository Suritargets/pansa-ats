/**
 * candidate/profile/page.tsx
 * WAT:    "Mijn profiel" (mobiel ontwerp 06): avatar, naam en functie, contactregels, "Profiel bewerken"
 *         (inklapbaar formulier voor e-mail/telefoon/adres) en "Mijn documenten" met kijk-link.
 * WAAROM: Een kandidaat mag alleen zijn eigen contactgegevens wijzigen (updateOwnContactInfo, gescoped op
 *         de sessie); documenten komen uit zijn eigen sollicitaties.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, FileText, LogOut, MapPin, Mail, Phone, Pencil } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getCandidateById, listDocumentsForCandidate } from '@/services/queries'
import { listOwnApplications } from '@/services/public'
import { updateOwnContactInfo } from '@/services/candidate-portal'
import { logoutAction } from '@/services/auth-actions'
import { PortalShell, SectionTitle, WhiteCard } from '@/components/portal/PortalShell'
import { Avatar } from '@/components/admin/Avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DOCUMENT_LABELS } from '@/lib/dossier'
import { formatDate } from '@/lib/utils'

export default async function CandidateProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const { saved } = await searchParams
  const [candidate, documents, applications] = await Promise.all([
    getCandidateById(session.candidateId),
    listDocumentsForCandidate(session.candidateId),
    listOwnApplications(session.candidateId),
  ])
  if (!candidate) redirect('/candidate')

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const row = (Icon: typeof Mail, value: string | null, empty: string) => (
    <li className="flex items-center gap-3 text-sm">
      <Icon className="size-4 shrink-0 text-[var(--color-brand-lime)]" />
      <span className={value ? 'text-white/90' : 'text-white/50'}>{value || empty}</span>
    </li>
  )

  return (
    <PortalShell variant="candidate" session={session} title="Mijn profiel" back="/candidate/home">
      <div className="flex flex-col items-center text-center">
        <Avatar name={fullName} size="lg" className="size-24 text-3xl" />
        <h2 className="mt-3 font-sans text-2xl font-black">{fullName}</h2>
        <p className="text-white/70">{applications[0]?.positionApplied ?? 'Kandidaat'}</p>
      </div>

      <ul className="mx-auto mt-5 max-w-sm space-y-2.5">
        {row(Mail, candidate.email, 'Geen e-mailadres')}
        {row(Phone, candidate.phone, 'Geen telefoonnummer')}
        {row(MapPin, [candidate.residence, candidate.district].filter(Boolean).join(', ') || candidate.address, 'Geen adres')}
      </ul>

      <details className="group mt-5 rounded-xl bg-white/10 open:bg-white/5">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold marker:content-none hover:bg-white/15">
          <Pencil className="size-4" />
          Profiel bewerken
        </summary>
        <form action={updateOwnContactInfo} className="space-y-4 rounded-b-xl bg-white p-4 text-[#10150f]">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={candidate.email ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" name="phone" defaultValue={candidate.phone ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Adres</Label>
            <Textarea id="address" name="address" defaultValue={candidate.address ?? ''} />
          </div>
          <Button type="submit" className="w-full">
            Opslaan
          </Button>
        </form>
      </details>

      {saved === '1' && (
        <Alert className="mt-4">
          <AlertDescription>Je gegevens zijn opgeslagen.</AlertDescription>
        </Alert>
      )}

      <SectionTitle title="Mijn documenten" />
      {documents.length === 0 ? (
        <WhiteCard className="text-sm text-[#5b6558]">Nog geen documenten. HR voegt stukken toe zodra ze binnen zijn.</WhiteCard>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <a
                href={`/api/documents/${doc.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ec] text-[#1c9848]">
                  <FileText className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{DOCUMENT_LABELS[doc.kind]}</span>
                  <span className="block truncate text-xs text-[#5b6558]">
                    {doc.fileName} · {formatDate(doc.createdAt)}
                  </span>
                </span>
                <ChevronRight className="size-4 text-[#8a9486]" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <form action={logoutAction.bind(null, '/candidate')} className="mt-8">
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10">
          <LogOut className="size-4" />
          Uitloggen
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-white/40">
        <Link href="/" className="hover:underline">
          Naar de voorpagina
        </Link>
      </p>
    </PortalShell>
  )
}
