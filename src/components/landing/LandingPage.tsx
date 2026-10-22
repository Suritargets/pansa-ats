'use client'

/**
 * LandingPage.tsx
 * WAT:    Publieke voorpagina in het Pansa-ontwerp: donkere industriële hero, schakelaar tussen
 *         "Werkzoeken" (kandidaten, lime) en "Voor bedrijven" (klanten, geel), zes genummerde
 *         kaarten, recente vacatures/kandidaten en een grote CTA.
 * WAAROM: De modus bepaalt de kleur (`--mode`), de koptekst, de kaarten en de onderste strook.
 *         Foto's komen uit /public/landing (zie README daar); ontbreekt een foto, dan blijft de
 *         gradient staan — nooit een kapot plaatje. Geen persoonsgegevens: kandidaten worden alleen
 *         als functie + plaats getoond.
 */

import { useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardList,
  FileSignature,
  FileText,
  Flame,
  Globe,
  GraduationCap,
  Handshake,
  LogIn,
  Newspaper,
  Plus,
  Search,
  User,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/landing/LogoMark'
import type { LandingData } from '@/services/queries'

export type LandingMode = 'werkzoeken' | 'bedrijven'

interface Tile {
  icon: LucideIcon
  title: string
  description: string
  href: string
  image: string
}

const TILES: Record<LandingMode, Tile[]> = {
  werkzoeken: [
    { icon: Briefcase, title: 'Vacatures', description: 'Zoek & solliciteer op beschikbare banen', href: '/vacatures', image: 'vacatures' },
    { icon: FileText, title: 'Mijn sollicitatie', description: 'Bekijk en beheer je sollicitaties', href: '/candidate', image: 'sollicitatie' },
    { icon: User, title: 'Mijn profiel', description: 'Beheer je gegevens en documenten', href: '/candidate/profile', image: 'profiel' },
    { icon: GraduationCap, title: 'Trainingen', description: 'Vergroot je kennis en vaardigheden', href: '/trainingen', image: 'trainingen' },
    { icon: Newspaper, title: 'Nieuws', description: 'Laatste vacatures en updates', href: '/nieuws', image: 'nieuws' },
    { icon: Building2, title: 'Bedrijven', description: 'Ontdek onze ondernemingen', href: '/bedrijven', image: 'bedrijven' },
  ],
  bedrijven: [
    { icon: Building2, title: 'Plaats een vacature', description: 'Vind gekwalificeerd personeel snel en eenvoudig', href: '/request-staffing', image: 'vacature-plaatsen' },
    { icon: Users, title: 'Zoek kandidaten', description: 'Doorzoek onze talentenpool en filter op vaardigheden', href: '/talentenpool', image: 'kandidaten' },
    { icon: ClipboardList, title: 'Beheer sollicitaties', description: 'Bekijk, beoordeel en selecteer kandidaten', href: '/client/dashboard', image: 'beheer' },
    { icon: Handshake, title: 'Plaatsing & onboarding', description: 'Begeleiding tot een succesvolle plaatsing', href: '/diensten#onboarding', image: 'onboarding' },
    { icon: BarChart3, title: 'Rapportages', description: 'Inzicht in plaatsingen, prestaties en kosten', href: '/diensten#rapportages', image: 'rapportages' },
    { icon: FileSignature, title: 'Contract & HR support', description: 'Ondersteuning bij contracten, wetgeving en HR-processen', href: '/diensten#hr-support', image: 'contract' },
  ],
}

/** Seconden per hero-foto; de totale cyclus is 3 × dit getal (moet gelijk zijn aan de 18s in globals.css). */
const HERO_SLIDE_SECONDS = 6

const HERO_SLIDES: Record<LandingMode, string[]> = {
  werkzoeken: ['hero', 'nieuws', 'bedrijven'],
  bedrijven: ['hero', 'trainingen', 'vacatures'],
}

const COMPANIES = [
  { name: 'CCC H. Pansa & Sons N.V.', tagline: 'Manpower, outsourcing & HR-diensten voor industriële mijnbouw' },
  { name: 'Pansa Machine Shop N.V.', tagline: 'Machinediensten' },
  { name: 'Pansa Industries', tagline: 'Industriële operaties' },
]

export function LandingPage({
  data,
  initialMode,
  logoSrc,
}: {
  data: LandingData
  initialMode: LandingMode
  logoSrc: string | null
}) {
  const [mode, setMode] = useState<LandingMode>(initialMode)
  const isCandidate = mode === 'werkzoeken'

  return (
    <div
      className="landing min-h-screen bg-[#0b100c] text-white"
      style={{ ['--mode' as string]: isCandidate ? 'var(--color-brand-lime)' : 'var(--color-brand-yellow)' }}
    >
      {/* Hero-achtergrond: foto (indien aanwezig) over een industriële gradient */}
      <div className="relative overflow-hidden">
        {/* Drie foto's die elke 6 s in elkaar overvloeien (zie .hero-slide in globals.css); daarboven de donkere gradient. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          {HERO_SLIDES[mode].map((image, i) => (
            <div
              key={image}
              className="hero-slide"
              style={{
                animationDelay: `${-i * HERO_SLIDE_SECONDS}s`,
                backgroundImage: `url(/landing/${image}.jpg), radial-gradient(90% 60% at 60% 35%, #3b3a1f 0%, #1a2416 45%, #0b100c 100%)`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,12,.55)_0%,rgba(11,16,12,.35)_45%,#0b100c_100%)]" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-24 right-6 hidden rotate-[-8deg] opacity-[0.07] lg:block"
        >
          <LogoMark src={logoSrc} size={220} />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-4 pt-5 sm:px-8">
          {/* Topbar */}
          <header className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/" className="flex items-center gap-3">
              <LogoMark src={logoSrc} size={56} />
              <span className="font-heading text-2xl leading-none font-semibold tracking-wide">
                PANSA GROUP
                <span className="block text-base font-normal tracking-wider text-white/85">OF COMPANIES N.V.</span>
              </span>
            </Link>
            <p className="hidden border-l border-white/20 pl-6 text-[11px] leading-tight font-bold tracking-wider text-[var(--color-brand-yellow)] uppercase md:block">
              The moving force
              <br />
              of the industries
            </p>

            <div className="order-last flex w-full justify-center lg:order-none lg:mx-auto lg:w-auto">
              <div className="clip-tab flex border border-white/10 bg-black/75 p-1">
                <ModeButton active={isCandidate} onClick={() => setMode('werkzoeken')} icon={User} title="Werkzoeken" subtitle="Voor kandidaten" />
                <ModeButton active={!isCandidate} onClick={() => setMode('bedrijven')} icon={Building2} title="Voor bedrijven" subtitle="Werknemers vinden" />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm font-medium sm:flex">
                <Globe className="size-4" />
                NL
              </span>
              <Link
                href={isCandidate ? '/candidate' : '/client'}
                className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                <LogIn className="size-4" />
                Inloggen
              </Link>
            </div>
          </header>

          {/* Hero */}
          <section className="max-w-2xl pt-14 pb-10 sm:pt-20">
            <p className="text-sm font-bold tracking-[0.2em] text-white/80 uppercase">Pansa Group</p>
            <h1 className="mt-3 font-sans text-[2.75rem] leading-[0.95] font-black tracking-tight uppercase italic sm:text-6xl lg:text-7xl">
              {isCandidate ? (
                <>
                  Jouw
                  <span className="block text-[var(--mode)]">volgende baan</span>
                  begint hier
                </>
              ) : (
                <>
                  <span className="block text-[var(--mode)]">De juiste mensen</span>
                  voor uw bedrijf
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              {isCandidate
                ? 'Solliciteer bij CCC H. Pansa & Sons N.V. en de andere bedrijven binnen de Pansa Group voor manpower- en outsourcing-plaatsingen.'
                : 'Snel, betrouwbaar en professioneel personeel voor de industriële, technische en mijnbouwsector.'}
            </p>
          </section>

          {/* Zes kaarten */}
          <section aria-label={isCandidate ? 'Voor kandidaten' : 'Voor bedrijven'} className="grid gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {TILES[mode].map((tile, i) => (
              <TileCard key={tile.title} tile={tile} index={i + 1} highlighted={i === 0} />
            ))}
          </section>
        </div>
      </div>

      {/* Onderste strook */}
      <section id="recent" className="mx-auto grid max-w-[1600px] gap-4 px-4 pb-10 sm:px-8 lg:grid-cols-[1fr_minmax(300px,380px)]">
        <div className="clip-tech bg-[#121812] p-5 ring-1 ring-white/10">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="flex items-center gap-2 font-sans text-xl font-black tracking-tight uppercase italic">
              {isCandidate ? <Flame className="size-5 text-[var(--color-brand-yellow)]" /> : <Users className="size-5 text-[var(--color-brand-yellow)]" />}
              {isCandidate ? 'Recente vacatures' : 'Recente kandidaten'}
            </h2>
            <p className="text-xs tracking-wider text-white/60 uppercase">
              {isCandidate ? 'Nieuwe kansen bij Pansa Group' : 'Uit ons netwerk'}
            </p>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {isCandidate &&
              data.vacancies.map((v) => (
                <RecentTile key={v.id} href="/vacatures" title={v.title} place={v.place} tag={v.tag} badge={v.isNew ? 'Nieuw' : v.quantity > 1 ? `${v.quantity}×` : undefined} />
              ))}
            {!isCandidate &&
              data.candidates.map((c) => (
                <RecentTile key={c.id} href="/talentenpool" title={c.role} place={c.place} tag={c.tag} badge="Beschikbaar" badgeTone="green" />
              ))}
            {(isCandidate ? data.vacancies : data.candidates).length === 0 && (
              <li className="col-span-full rounded-lg border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/60">
                {isCandidate
                  ? 'Er staan op dit moment geen vacatures open. Solliciteer open — wij nemen contact op zodra er een passende plek is.'
                  : 'Nog geen kandidaten om te tonen. Plaats een vacature en wij zoeken in ons netwerk.'}
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="clip-tech flex items-center gap-4 bg-[#121812] p-5 ring-1 ring-white/10">
            {isCandidate ? <Users className="size-9 text-[var(--mode)]" /> : <Building2 className="size-9 text-[var(--mode)]" />}
            <p className="font-heading text-5xl leading-none font-semibold tabular-nums">
              {isCandidate ? data.openVacancies : data.availableCandidates}
            </p>
            <p className="text-xs leading-tight font-semibold tracking-wider text-white/80 uppercase">
              {isCandidate ? 'Actieve vacatures' : <>Beschikbare kandidaten<br />in ons netwerk</>}
            </p>
            <ChevronRight className="ml-auto size-5 text-[var(--mode)]" />
          </div>
          <Link
            href={isCandidate ? '/vacatures' : '/request-staffing'}
            className="clip-tech flex items-center justify-center gap-3 bg-[var(--color-brand-yellow)] px-6 py-5 font-heading text-2xl font-semibold tracking-wide text-[#0b100c] uppercase hover:bg-[#ffd94d] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            {isCandidate ? <Search className="size-6" /> : <Plus className="size-6" />}
            {isCandidate ? 'Alle vacatures bekijken' : 'Plaats nu een vacature'}
            <ChevronRight className="size-6" />
          </Link>
        </div>
      </section>

      {/* Bedrijven */}
      <section id="bedrijven" className="mx-auto max-w-[1600px] px-4 pb-14 sm:px-8">
        <h2 className="font-sans text-xl font-black tracking-tight uppercase italic">
          <Link href="/bedrijven" className="hover:underline">Onze ondernemingen</Link>
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {COMPANIES.map((c) => (
            <li key={c.name} className="clip-tech-sm bg-[#121812] p-4 ring-1 ring-white/10">
              <p className="font-heading text-xl font-semibold tracking-wide">{c.name}</p>
              <p className="mt-1 text-sm text-white/65">{c.tagline}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
          <span>© Pansa Group of Companies N.V. · Martin Luther Kingweg km 23, Para, Suriname</span>
          <Link href="/admin" className="hover:text-white/80">
            Medewerkersportaal
          </Link>
        </p>
      </section>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
}: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'clip-tab flex items-center gap-3 px-6 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:px-8',
        active
          ? 'bg-[var(--mode)] text-[#0b100c]'
          : 'text-white/85 hover:bg-white/10'
      )}
    >
      <Icon className="size-7" />
      <span>
        <span className="block font-heading text-2xl leading-none font-semibold tracking-wide uppercase">{title}</span>
        <span className={cn('block text-[11px] tracking-wider uppercase', active ? 'text-[#0b100c]/80' : 'text-white/60')}>{subtitle}</span>
      </span>
    </button>
  )
}

function TileCard({ tile, index, highlighted }: { tile: Tile; index: number; highlighted: boolean }) {
  const Icon = tile.icon
  const className = cn(
    // Geen ring/box-shadow: die wordt door de clip-path afgesneden. Een echte border blijft wél zichtbaar.
    'group clip-tech relative flex min-h-72 flex-col justify-end overflow-hidden border bg-[#121812] focus-visible:border-white focus-visible:outline-none',
    highlighted ? 'border-2 border-[var(--mode)]' : 'border-white/10'
  )
  const body = (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(11,16,12,0) 20%, rgba(11,16,12,.92) 72%), url(/landing/${tile.image}.jpg), linear-gradient(160deg, #2a3324 0%, #15201a 55%, #0f1510 100%)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
        <span className="font-heading text-xl font-semibold tracking-wide text-white/90">{String(index).padStart(2, '0')}</span>
        <span
          aria-hidden="true"
          className="h-3 w-10 [background:repeating-linear-gradient(115deg,var(--stripe)_0_4px,transparent_4px_9px)]"
          style={{ ['--stripe' as string]: highlighted ? 'var(--mode)' : 'rgba(255,255,255,.7)' }}
        />
      </div>
      <div className="relative px-4 pb-4">
        <span
          className={cn(
            'clip-tech-sm mb-3 flex size-14 items-center justify-center bg-black/70 ring-1',
            highlighted ? 'ring-[var(--mode)] text-[var(--mode)]' : 'ring-white/30 text-white'
          )}
        >
          <Icon className="size-7" />
        </span>
        <p className="font-heading text-[1.6rem] leading-none font-semibold tracking-wide uppercase">{tile.title}</p>
        <p className="mt-1.5 pr-8 text-sm leading-snug text-white/80">{tile.description}</p>
        <ChevronRight className="absolute right-4 bottom-5 size-6 text-white/80" />
      </div>
    </>
  )
  return (
    <Link href={tile.href} className={className}>
      {body}
    </Link>
  )
}

function RecentTile({
  href,
  title,
  place,
  tag,
  badge,
  badgeTone = 'yellow',
}: {
  href: string
  title: string
  place: string
  tag: string
  badge?: string
  badgeTone?: 'yellow' | 'green'
}) {
  return (
    <li>
      <Link href={href} className="clip-tech-sm flex h-full items-center gap-3 bg-black/45 p-3 ring-1 ring-white/10 transition-colors hover:bg-white/5">
        <span className="clip-tech-sm size-16 shrink-0 bg-[linear-gradient(160deg,#2a3324,#0f1510)]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{title}</span>
          <span className="block truncate text-xs text-white/65">{place}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80">{tag}</span>
            {badge && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold uppercase',
                  badgeTone === 'green' ? 'bg-[var(--color-brand-green)] text-white' : 'bg-[var(--color-brand-yellow)] text-[#0b100c]'
                )}
              >
                {badge}
              </span>
            )}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[var(--mode)]" />
      </Link>
    </li>
  )
}
