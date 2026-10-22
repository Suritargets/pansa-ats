/**
 * PipelineTiles.tsx
 * WAT:    "Pipeline per status": acht fototegels met icoon, status, aantal en pijl — elke tegel
 *         opent de sollicitatielijst gefilterd op die status.
 * WAAROM: Server component; foto's uit /public/landing, kleuren per status uit het dashboardontwerp.
 */

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Briefcase,
  CircleX,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  MessagesSquare,
  UserPlus,
  Users,
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/database'

const TILES: { status: ApplicationStatus; label: string; icon: LucideIcon; color: string; image: string }[] = [
  { status: 'new', label: 'Nieuw', icon: UserPlus, color: '#1c9848', image: 'vacatures' },
  { status: 'in_review', label: 'In beoordeling', icon: ClipboardCheck, color: '#f8cc39', image: 'sollicitatie' },
  { status: 'shortlisted', label: 'Shortlist', icon: Users, color: '#1976d2', image: 'profiel' },
  { status: 'interview', label: 'Gesprek', icon: MessagesSquare, color: '#7e57c2', image: 'trainingen' },
  { status: 'offer', label: 'Aanbod', icon: Handshake, color: '#0d4726', image: 'contract' },
  { status: 'onboarding', label: 'Onboarding', icon: GraduationCap, color: '#5e35b1', image: 'onboarding' },
  { status: 'active', label: 'Actief geplaatst', icon: Briefcase, color: '#2e7d32', image: 'hero' },
  { status: 'rejected', label: 'Afgewezen', icon: CircleX, color: '#e53935', image: 'nieuws' },
]

export function PipelineTiles({ counts }: { counts: Partial<Record<ApplicationStatus, number>> }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TILES.map((tile) => {
        const Icon = tile.icon
        return (
          <li key={tile.status}>
            <Link
              href={`/admin/applications?status=${tile.status}`}
              className="group relative flex h-20 items-center gap-3 overflow-hidden rounded-xl bg-cover bg-center px-3 text-white ring-1 ring-foreground/10 focus-visible:ring-4 focus-visible:ring-primary/60 focus-visible:outline-none"
              style={{ backgroundImage: `url(/landing/${tile.image}.jpg)`, borderLeft: `4px solid ${tile.color}` }}
            >
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,12,.9)_0%,rgba(8,20,12,.7)_55%,rgba(8,20,12,.35)_100%)]" />
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tile.color }}>
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <span className="relative min-w-0 flex-1 leading-tight">
                <span className="block text-sm font-medium text-white/90">{tile.label}</span>
                <span className="block font-heading text-3xl leading-none font-semibold tabular-nums">{counts[tile.status] ?? 0}</span>
              </span>
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors group-hover:bg-white/30">
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
