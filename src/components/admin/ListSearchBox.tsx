'use client'

/**
 * ListSearchBox.tsx
 * WAT:    Herbruikbare zoekbalk voor lijstpagina's — schrijft naar de `search` query-param
 *         (debounced), zelfde URL-param-patroon als StatusFilter/CandidateFilters.
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export function ListSearchBox({ placeholder = 'Zoeken...' }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') ?? '')

  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = searchParams.get('search') ?? ''
      if (value === current) return
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) params.set('search', value.trim())
      else params.delete('search')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    }, 300)
    return () => clearTimeout(timeout)
  }, [value, pathname, router, searchParams])

  return (
    <div className="relative w-64">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
    </div>
  )
}
