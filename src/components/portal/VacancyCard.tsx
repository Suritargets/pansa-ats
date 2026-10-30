/**
 * VacancyCard.tsx
 * WAT:    Vacaturekaart uit het mobiele ontwerp: foto links, functie, plaats, branche-tag,
 *         "Nieuw"-badge en leeftijd van de aanvraag. Hele kaart is een link naar de vacaturepagina.
 */

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { branchePhoto } from '@/constants/photos'
import type { PublicVacancy } from '@/services/public'
import { cn } from '@/lib/utils'

export function daysAgoLabel(date: Date): string {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
  if (days === 0) return 'vandaag'
  if (days === 1) return '1 dag geleden'
  if (days < 30) return `${days} dagen geleden`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'maand' : 'maanden'} geleden`
}

export function VacancyThumb({ vacancy, className }: { vacancy: Pick<PublicVacancy, 'brancheKey'>; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block shrink-0 bg-cover bg-center', className)}
      style={{ backgroundImage: `url(${branchePhoto(vacancy.brancheKey)}), linear-gradient(160deg,#2a3324,#0f1510)` }}
    />
  )
}

export function VacancyCard({ vacancy, compact = false }: { vacancy: PublicVacancy; compact?: boolean }) {
  return (
    <Link
      href={`/vacatures/${vacancy.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 text-[#10150f] shadow-sm transition-transform active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      <VacancyThumb vacancy={vacancy} className={cn('rounded-xl', compact ? 'size-16' : 'size-20')} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-base font-bold">{vacancy.title}</span>
          {vacancy.isNew && (
            <span className="shrink-0 rounded-md bg-[var(--color-brand-lime)] px-2 py-0.5 text-[11px] font-bold text-[#0b100c]">Nieuw</span>
          )}
        </span>
        <span className="block truncate text-sm text-[#1c9848]">{vacancy.place}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-[#5b6558]">
          <MapPin className="size-3" />
          Suriname
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5b6558]">
          <span className="rounded-md bg-[#eef3ec] px-2 py-0.5 font-medium">{vacancy.branche}</span>
          {vacancy.quantity > 1 && <span className="rounded-md bg-[#eef3ec] px-2 py-0.5 font-medium">{vacancy.quantity} plekken</span>}
          <span className="ml-auto">{daysAgoLabel(vacancy.createdAt)}</span>
        </span>
      </span>
    </Link>
  )
}
