/**
 * admin/candidates/[id]/page.tsx
 * WAT:    Kandidaat-profielpagina in het Pansa-ontwerp: kopkaart (avatar, naam, functie, contact,
 *         status laatste sollicitatie, Bewerken, naar sollicitatie) en tabs Samenvatting · CV &
 *         documenten · Sollicitaties · Notities.
 * WAAROM: Bundelt alles van één kandidaat over al zijn sollicitaties heen; de sollicitatie-detail-
 *         pagina blijft de plek voor het proces (interviews, dossier, contract).
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ExternalLink, FileText, Plus } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { getCandidateById, listApplicationsForCandidate, listDocumentsForCandidate } from '@/services/queries'
import { AdminShell } from '@/components/admin/AdminShell'
import { Avatar } from '@/components/admin/Avatar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CandidateEditButton } from '@/components/admin/CandidateEditButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { coiSummaryLines } from '@/constants/coi'
import { DOCUMENT_LABELS } from '@/lib/dossier'
import { registrationLabel } from '@/lib/registration'
import { formatDate } from '@/lib/utils'

function ageFromIso(iso: string | null): string | undefined {
  if (!iso) return undefined
  const dob = new Date(iso)
  if (Number.isNaN(dob.getTime())) return undefined
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--
  return `${age} jaar`
}

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession([...STAFF_ROLES])
  const { id } = await params
  const candidate = await getCandidateById(id)
  if (!candidate) notFound()

  const [applications, documents] = await Promise.all([listApplicationsForCandidate(id), listDocumentsForCandidate(id)])
  const latest = applications[0] ?? null
  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const location = [candidate.residence, candidate.district].filter(Boolean).join(', ') || null

  return (
    <AdminShell session={session}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Kandidaat profiel</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Volledig overzicht van kandidaat</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CandidateEditButton candidate={candidate} />
          {latest ? (
            <Button nativeButton={false} render={<Link href={`/admin/applications/${latest.id}`} />}>
              Naar sollicitatie
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/admin/digitize" />}>
              <Plus className="size-4" />
              Nieuwe sollicitatie
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6 rounded-2xl shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar name={fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-semibold text-foreground">{fullName}</h2>
            <p className="text-sm text-foreground">
              {latest ? latest.positionApplied : 'Nog geen sollicitatie'}
              {latest && <span className="text-muted-foreground"> · {latest.company.name}</span>}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
              <span>{candidate.email || 'geen e-mail'}</span>
              <span>{candidate.phone || 'geen telefoon'}</span>
              {location && <span>{location}</span>}
              <span>Registratienr {registrationLabel(candidate)}</span>
            </p>
          </div>
          {latest && <StatusBadge status={latest.status} className="h-7 px-3 text-sm" />}
        </CardContent>
      </Card>

      <Tabs defaultValue="samenvatting">
        <TabsList className="flex-wrap">
          <TabsTrigger value="samenvatting">Samenvatting</TabsTrigger>
          <TabsTrigger value="documenten">CV &amp; documenten ({documents.length})</TabsTrigger>
          <TabsTrigger value="sollicitaties">Sollicitaties ({applications.length})</TabsTrigger>
          <TabsTrigger value="notities">Notities</TabsTrigger>
        </TabsList>

        <TabsContent value="samenvatting" className="pt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Persoonsgegevens</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <Row label="Volledige naam" value={`${candidate.lastName}, ${candidate.firstName}`} />
                  <Row label="Leeftijd" value={ageFromIso(candidate.dateOfBirth)} />
                  <Row label="Geboortedatum" value={formatDate(candidate.dateOfBirth)} />
                  <Row label="Locatie" value={location} />
                  <Row label="Nationaliteit" value={candidate.nationality} />
                  <Row label="ID-nummer" value={candidate.idNumber} />
                  <Row
                    label="Rijbewijs"
                    value={
                      candidate.hasDriversLicense === null
                        ? undefined
                        : candidate.hasDriversLicense
                          ? `Ja — categorie ${candidate.driversLicenseCategory || '?'}`
                          : 'Nee'
                    }
                  />
                  <Row label="Beschikbaarheid" value={candidate.availabilityDate ? formatDate(candidate.availabilityDate) : 'Per direct'} />
                  <Row label="Datum goedgedrag" value={formatDate(candidate.policeClearanceDate)} />
                  <Row label="Geregistreerd" value={formatDate(candidate.createdAt)} />
                </dl>
                {coiSummaryLines(candidate.communityOfInterest).length > 0 && (
                  <div className="mt-5">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Community of Interest (RGM)</p>
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground">
                      {coiSummaryLines(candidate.communityOfInterest).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Vaardigheden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.skills.length === 0 && candidate.certifications.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nog geen vaardigheden vastgelegd — voeg ze toe via Bewerken.</p>
                  )}
                  {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#1c9848]/12 px-2.5 py-0.5 text-xs font-semibold text-[#146d34]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {candidate.certifications.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Certificaten</p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.certifications.map((cert) => (
                          <span key={cert} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.yearsExperience && (
                    <p className="text-sm text-muted-foreground">{candidate.yearsExperience} jaar werkervaring</p>
                  )}
                </CardContent>
              </Card>

              {candidate.workHistory.length > 0 && (
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Werkervaring</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {candidate.workHistory.map((entry, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-foreground">
                          {entry.company}
                          {entry.role ? ` — ${entry.role}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.period || '—'}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {candidate.education.length > 0 && (
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Opleiding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {candidate.education.map((entry, i) => (
                      <p key={i} className="text-sm text-foreground">
                        {entry.level}
                        {entry.fieldOfStudy ? ` — ${entry.fieldOfStudy}` : ''}{' '}
                        <span className="text-xs text-muted-foreground">({entry.completed ? 'afgerond' : 'niet afgerond'})</span>
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documenten" className="space-y-4 pt-4">
          {applications.length > 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">CV (Pansa-sjabloon)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {applications.map((app) => (
                  <Button key={app.id} variant="outline" nativeButton={false} render={<a href={`/admin/applications/${app.id}/cv`} target="_blank" rel="noopener noreferrer" />}>
                    <FileText className="size-4" />
                    CV — {app.positionApplied} ({app.company.name})
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Documenten</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen documenten. Upload ze via het tabblad Dossier van een sollicitatie.</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{DOCUMENT_LABELS[doc.kind]}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.fileName} · {doc.positionApplied} · {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" />}>
                        <ExternalLink className="size-3.5" />
                        Bekijken
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sollicitaties" className="pt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen sollicitaties voor deze kandidaat.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {applications.map((app) => (
                    <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-foreground">{app.positionApplied}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.company.name} · {formatDate(app.createdAt)} ·{' '}
                          {app.source === 'digitized_paper' ? 'handgeschreven' : 'online'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={app.status} />
                        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/applications/${app.id}`} />}>
                          Openen
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notities" className="pt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Notities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.notes ? (
                <p className="text-sm whitespace-pre-wrap text-foreground">{candidate.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nog geen notities. Gebruik Bewerken om een notitie toe te voegen.</p>
              )}
              {candidate.personalCompetencies && (
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Persoonlijke competenties</p>
                  <p className="text-sm text-foreground">{candidate.personalCompetencies}</p>
                </div>
              )}
              {candidate.languageSkills && (
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Taalvaardigheid</p>
                  <p className="text-sm text-foreground">{candidate.languageSkills}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || '—'}</dd>
    </div>
  )
}
