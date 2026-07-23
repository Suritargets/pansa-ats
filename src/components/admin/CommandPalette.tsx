'use client'

/**
 * CommandPalette.tsx
 * WAT:    Omni-search (Ctrl+K / Ctrl+Shift+K) — snel navigeren naar een instelling of
 *         zoeken naar een kandidaat/client/sollicitatie, zonder door de sidebar te klikken.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { ADMIN_NAV } from '@/constants/nav'
import { globalSearch, type SearchResult } from '@/services/search'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

interface PaletteItem {
  id: string
  title: string
  subtitle: string
  href: string
  group: string
}

export function CommandPalette({ role }: { role: UserRole }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dataResults, setDataResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navItems: PaletteItem[] = useMemo(
    () =>
      ADMIN_NAV.filter((group) => !group.roles || group.roles.includes(role)).flatMap((group) =>
        group.items.map((item) => ({
          id: item.href,
          title: item.label,
          subtitle: group.label ?? 'Navigatie',
          href: item.href,
          group: 'Navigeren',
        }))
      ),
    [role]
  )

  const openPalette = useCallback(() => {
    setQuery('')
    setDataResults([])
    setActiveIndex(0)
    setOpen(true)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        if (open) setOpen(false)
        else openPalette()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, openPalette])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) return
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await globalSearch(query)
        setDataResults(results)
      })
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const filteredNav = navItems.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
  const results: PaletteItem[] = query.trim()
    ? [...filteredNav, ...dataResults.map((r) => ({ id: `${r.group}-${r.id}`, title: r.title, subtitle: r.subtitle, href: r.href, group: r.group }))]
    : navItems

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = results[activeIndex]
      if (target) go(target.href)
    }
  }

  const resultsWithGroupFlag = results.map((item, i) => ({
    ...item,
    showGroupHeader: i === 0 || results[i - 1].group !== item.group,
  }))

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="flex w-64 items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Zoeken...</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.65rem]">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-24" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  const next = e.target.value
                  setQuery(next)
                  setActiveIndex(0)
                  if (next.trim().length < 2) setDataResults([])
                }}
                onKeyDown={onKeyDown}
                placeholder="Zoek instellingen, kandidaten, clienten, sollicitaties..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 && <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">Geen resultaten.</p>}
              {resultsWithGroupFlag.map((item, i) => {
                return (
                  <div key={item.id}>
                    {item.showGroupHeader && (
                      <p className="px-2.5 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.group}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        'flex w-full flex-col items-start rounded-lg px-2.5 py-2 text-left text-sm',
                        i === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      )}
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
