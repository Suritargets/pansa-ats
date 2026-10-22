'use client'

/**
 * YearSelect.tsx
 * WAT:    Jaarkeuze voor Rapportages (`?year=`), met kalender-icoon zoals in het ontwerp.
 */

import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, ChevronDown } from 'lucide-react'

export function YearSelect({ years, value }: { years: number[]; value: number }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <label className="relative flex h-10 items-center gap-2 rounded-xl border border-border bg-card pr-9 pl-3 text-sm font-medium text-foreground shadow-sm">
      <CalendarDays className="size-4 text-muted-foreground" />
      <span className="sr-only">Jaar</span>
      <select
        value={value}
        onChange={(e) => router.push(`${pathname}?year=${e.target.value}`)}
        className="cursor-pointer appearance-none bg-transparent pr-2 outline-none"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
    </label>
  )
}
