/**
 * client/applications/[id]/page.tsx
 * WAT:    Kandidaatprofiel voor de client (mobiel ontwerp 09): kopkaart met avatar en status, tabs
 *         Overzicht / CV / Feedback, vaardigheden en "Contact opnemen".
 * WAAROM: Een client ziet bewust alleen een CV-beperkte selectie: functie, nationaliteit, ervaring,
 *         beschikbaarheid, vaardigheden, certificaten, werkervaring, opleiding en talen — geen ID-nummer,
 *         adres, telefoon, e-mail, bankgegevens of interne HR-scores. De sessie (`clientId`) bepaalt welke
 *         profielen zichtbaar zijn; het id in de URL wordt altijd tegen de share gecontroleerd.
 */

import { notFound, redirect } from 'next/navigation'
import { Calendar, GraduationCap, Mail, MapPin, Briefcase } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getSharedApplicationForClient } from '@/services/queries'
import { PortalShell, WhiteCard } from '@/components/portal/PortalShell'
import { Avatar } from '@/components/admin/Avatar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ClientFeedbackForm } from '@/components/client/ClientFeedbackForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'

export default async function ClientApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) redirect('/client')

  const { id } = await params
  const application = await getSharedApplicationForClient(id, session.clientId)
  if (!application) notFound()

  const { candidate } = application
  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const location = [candidate.residence, candidate.district].filter(Boolean).join(', ') || null

  return (
    <PortalShell variant="client" session={session} wide title="Kandidaat profiel" back="/client/candidates" bottomNav>
      <WhiteCard className="flex items-center gap-4">
        <Avatar name={fullName} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold">{fullName}</span>
          <span className="block text-sm text-[#5b6558]">{application.positionApplied}</span>
          {location && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-[#8a9486]">
              <MapPin className="size-3 shrink-0" />
              {location}
            </span>
          )}
        </span>
        <StatusBadge status={application.status} />
      </WhiteCard>

      <Tabs defaultValue="overzicht" className="mt-4">
        <TabsList className="h-10 w-full bg-white/10">
          <TabsTrigger value="overzicht" className="text-white/80">Overzicht</TabsTrigger>
          <TabsTrigger value="cv" className="text-white/80">CV</TabsTrigger>
          <TabsTrigger value="feedback" className="text-white/80">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4 pt-4">
          <WhiteCard>
            <dl className="space-y-3 text-sm">
              <Row icon={Briefcase} label="Werkervaring" value={candidate.yearsExperience ? `${candidate.yearsExperience} jaar` : null} />
              <Row icon={GraduationCap} label="Opleiding" value={candidate.education[0] ? `${candidate.education[0].level}${candidate.education[0].fieldOfStudy ? ` — ${candidate.education[0].fieldOfStudy}` : ''}` : null} />
              <Row icon={MapPin} label="Locatie" value={location} />
              <Row icon={Calendar} label="Beschikbaar" value={candidate.availabilityDate ? formatDate(candidate.availabilityDate) : 'Per direct'} />
            </dl>
          </WhiteCard>

          <WhiteCard>
            <h3 className="mb-2 font-bold">Vaardigheden</h3>
            {candidate.skills.length === 0 && candidate.certifications.length === 0 ? (
              <p className="text-sm text-[#5b6558]">Nog geen vaardigheden vastgelegd.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-[#1c9848]/12 px-2.5 py-1 text-xs font-semibold text-[#146d34]">
                    {skill}
                  </span>
                ))}
                {candidate.certifications.map((cert) => (
                  <span key={cert} className="rounded-full border border-[#d6ddd3] px-2.5 py-1 text-xs">
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </WhiteCard>

          <a
            href={`mailto:humanresource@hpsnv.com?subject=${encodeURIComponent(`Kandidaat ${fullName} (${application.positionApplied})`)}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-green)] px-5 py-4 text-base font-bold text-white"
          >
            <Mail className="size-5" />
            Contact opnemen met Pansa HR
          </a>
        </TabsContent>

        <TabsContent value="cv" className="space-y-4 pt-4">
          <WhiteCard>
            <h3 className="mb-2 font-bold">Werkervaring</h3>
            {candidate.workHistory.length === 0 ? (
              <p className="text-sm text-[#5b6558]">Geen werkervaring vastgelegd.</p>
            ) : (
              <ul className="space-y-3">
                {candidate.workHistory.map((entry, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-semibold">
                      {entry.company}
                      {entry.role ? ` — ${entry.role}` : ''}
                    </p>
                    <p className="text-xs text-[#5b6558]">{entry.period || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </WhiteCard>
          {candidate.education.length > 0 && (
            <WhiteCard>
              <h3 className="mb-2 font-bold">Opleiding</h3>
              <ul className="space-y-1.5 text-sm">
                {candidate.education.map((entry, i) => (
                  <li key={i}>
                    {entry.level}
                    {entry.fieldOfStudy ? ` — ${entry.fieldOfStudy}` : ''}{' '}
                    <span className="text-xs text-[#5b6558]">({entry.completed ? 'afgerond' : 'niet afgerond'})</span>
                  </li>
                ))}
              </ul>
            </WhiteCard>
          )}
          {(candidate.languageSkills || candidate.personalCompetencies) && (
            <WhiteCard className="space-y-3 text-sm">
              {candidate.languageSkills && (
                <div>
                  <h3 className="font-bold">Talen</h3>
                  <p className="text-[#3f4a3d]">{candidate.languageSkills}</p>
                </div>
              )}
              {candidate.personalCompetencies && (
                <div>
                  <h3 className="font-bold">Persoonlijke competenties</h3>
                  <p className="text-[#3f4a3d]">{candidate.personalCompetencies}</p>
                </div>
              )}
            </WhiteCard>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="pt-4">
          <WhiteCard>
            <h3 className="mb-1 font-bold">Uw feedback</h3>
            <p className="mb-3 text-xs text-[#5b6558]">Gedeeld op {formatDate(application.share.sharedAt)}. Pansa HR ziet uw feedback direct.</p>
            <ClientFeedbackForm applicationId={application.id} initialFeedback={application.share.clientFeedback ?? ''} />
          </WhiteCard>
        </TabsContent>
      </Tabs>
    </PortalShell>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-[#1c9848]" />
      <dt className="w-28 shrink-0 text-[#5b6558]">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
