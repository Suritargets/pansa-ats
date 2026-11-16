'use client'

/**
 * CommandPalette.tsx
 * WAT:    Ctrl+K-palette voor staff. Leeg: kaarten met snelle acties en sneltoetsen (cijfers of Alt+letter).
 *         Met tekst: zoeken op kandidaat, sollicitatie/dossier, client of leverancier — op naam, registratienummer,
 *         ID, e-mail of telefoon — plus de menu-items en acties.
 * TIP:    Cijfers op een leeg zoekveld starten een snelle actie. Wil je op een nummer zoeken, begin dan met '#'
 *         (bv. '#1042') of met 'REG-'.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Building2,
  ClipboardList,
  CornerDownLeft,
  Download,
  FileSignature,
  FileText,
  GraduationCap,
  Inbox,
  ListChecks,
  ScanLine,
  Search,
  Truck,
  Upload,
  Users,
  Banknote,
  type LucideIcon,
} from 'lucide-react'
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
  icon?: LucideIcon
  /** '1'..'0' (alleen bij leeg zoekveld) of 'Alt+R' (altijd). */
  hotkey?: string
}

const GRID_COLUMNS = 3

const ACTION_GROUPS: { label: string; items: Omit<PaletteItem, 'group' | 'id'>[] }[] = [
  {
    label: 'Snelle acties',
    items: [
      { title: 'Digitaliseren', subtitle: 'Papieren formulier overtypen', href: '/admin/digitize', icon: ScanLine, hotkey: '1' },
      { title: 'Nieuwe client', subtitle: 'Mijnbouwklant toevoegen', href: '/admin/clients/new', icon: Building2, hotkey: '2' },
      { title: 'Nieuwe leverancier', subtitle: 'Leverancier/Relatie toevoegen', href: '/admin/suppliers/new', icon: Truck, hotkey: '3' },
      { title: 'Kandidaten importeren', subtitle: 'Uit CSV', href: '/admin/candidates/import', icon: Upload, hotkey: '4' },
      { title: 'Vacature-aanvragen', subtitle: 'Van clienten', href: '/admin/client-requests', icon: Inbox, hotkey: '5' },
      { title: 'Online formulier', subtitle: 'Publiek sollicitatieformulier', href: '/apply', icon: FileText, hotkey: '6' },
    ],
  },
  {
    label: 'Werving & Onboarding',
    items: [
      { title: 'Sollicitaties', subtitle: 'Alle dossiers', href: '/admin/applications', icon: ClipboardList, hotkey: '7' },
      { title: 'Kandidaten', subtitle: 'Alle kandidaten', href: '/admin/candidates', icon: Users, hotkey: '8' },
      { title: 'Contracten & badges', subtitle: 'Einddatums en proeftijd', href: '/admin/contracts', icon: FileSignature, hotkey: '9' },
      { title: 'Onboarding', subtitle: 'Checklists per kandidaat', href: '/admin/onboarding', icon: ListChecks, hotkey: '0' },
    ],
  },
  {
    label: 'Rapportage & export',
    items: [
      { title: 'Rapportages', subtitle: 'Funnel en doorlooptijd', href: '/admin/reports', icon: BarChart3, hotkey: 'Alt+R' },
      { title: 'Algemene export', subtitle: 'CSV', href: '/admin/export', icon: Download, hotkey: 'Alt+E' },
      { title: 'Payroll export', subtitle: 'Batch voor payroll', href: '/admin/export/payroll', icon: Banknote, hotkey: 'Alt+P' },
      { title: 'Trainingen', subtitle: 'Catalogus en voortgang', href: '/admin/trainings', icon: GraduationCap, hotkey: 'Alt+T' },
    ],
  },
]

const ACTIONS: PaletteItem[] = ACTION_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ ...item, id: `action-${item.href}`, group: g.label }))
)

/** Alt+letter → href; cijfer → href. */
const ALT_HOTKEYS = new Map(
  ACTIONS.filter((a) => a.hotkey?.startsWith('Alt+')).map((a) => [`Key${a.hotkey!.slice(4)}`, a.href])
)
const DIGIT_HOTKEYS = new Map(ACTIONS.filter((a) => a.hotkey && /^\d$/.test(a.hotkey)).map((a) => [a.hotkey!, a.href]))

export function CommandPalette({ role }: { role: UserRole }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dataResults, setDataResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef(0)

  // '#' vooraan = "dit is een nummer", niet bedoeld als zoekterm zelf
  const term = query.trim().replace(/^#/, '').trim()

  const navItems: PaletteItem[] = useMemo(() => {
    const actionHrefs = new Set(ACTIONS.map((a) => a.href))
    return ADMIN_NAV.filter((group) => !group.roles || group.roles.includes(role))
      .flatMap((group) =>
        group.items.map((item) => ({
          id: `nav-${item.href}`,
          title: item.label,
          subtitle: group.label ?? 'Navigatie',
          href: item.href,
          group: 'Navigeren',
          icon: item.icon,
        }))
      )
      .filter((item) => !actionHrefs.has(item.href))
  }, [role])

  const close = useCallback(() => setOpen(false), [])

  const openPalette = useCallback(() => {
    setQuery('')
    setDataResults([])
    setActiveIndex(0)
    setOpen(true)
  }, [])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  // Globale sneltoetsen: Ctrl/Cmd+K, Escape, Alt+letter (altijd) en cijfers (palette open + leeg veld)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) close()
        else openPalette()
        return
      }
      if (e.key === 'Escape' && open) {
        close()
        return
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const href = ALT_HOTKEYS.get(e.code)
        if (href) {
          e.preventDefault()
          go(href)
          return
        }
      }
      if (open && query === '' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const href = DIGIT_HOTKEYS.get(e.key)
        if (href) {
          e.preventDefault()
          go(href)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, query, close, openPalette, go])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Data zoeken met debounce; verouderde antwoorden worden genegeerd
  useEffect(() => {
    if (term.length < 2) return
    const request = ++requestRef.current
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const results = await globalSearch(term)
          if (request === requestRef.current) {
            setDataResults(results)
            setActiveIndex(0)
          }
        } catch {
          if (request === requestRef.current) setDataResults([])
        }
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [term])

  const searching = term.length > 0
  const items: PaletteItem[] = useMemo(() => {
    if (!searching) return ACTIONS
    const needle = term.toLowerCase()
    const commands = [...ACTIONS, ...navItems].filter(
      (item) => item.title.toLowerCase().includes(needle) || item.subtitle.toLowerCase().includes(needle)
    )
    const data: PaletteItem[] = dataResults.map((r) => ({
      id: `${r.group}-${r.id}`,
      title: r.title,
      subtitle: r.subtitle,
      href: r.href,
      group: r.group,
    }))
    // Zoekresultaten uit de database eerst: wie een naam of nummer intypt, zoekt een persoon of dossier
    return term.length >= 2 ? [...data, ...commands] : commands
  }, [searching, term, dataResults, navItems])

  // Actieve rij in beeld houden bij pijltjesnavigatie
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, items])

  function onInputKeyDown(e: React.KeyboardEvent) {
    const last = items.length - 1
    const grid = !searching
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + (grid ? GRID_COLUMNS : 1), last))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - (grid ? GRID_COLUMNS : 1), 0))
    } else if (grid && e.key === 'ArrowRight') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, last))
    } else if (grid && e.key === 'ArrowLeft') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = items[activeIndex]
      if (target) go(target.href)
    }
  }

  const sections: { label: string; entries: { item: PaletteItem; index: number }[] }[] = []
  items.forEach((item, index) => {
    const section = sections[sections.length - 1]
    if (section && section.label === item.group) section.entries.push({ item, index })
    else sections.push({ label: item.group, entries: [{ item, index }] })
  })

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="flex h-10 w-full max-w-xl items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span className="flex-1 truncate text-left">Zoek kandidaat, dossier, client, nummer of typ een actie…</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.65rem]">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-3 pt-[10vh] backdrop-blur-[2px]" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Snel zoeken en acties"
            className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  const next = e.target.value
                  setQuery(next)
                  setActiveIndex(0)
                  if (next.trim().replace(/^#/, '').trim().length < 2) setDataResults([])
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Zoek kandidaat, dossier, client, registratienummer, ID of typ een opdracht…"
                aria-label="Zoeken"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {pending && <span className="shrink-0 text-xs text-muted-foreground">Zoeken…</span>}
              <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.65rem] sm:block">Esc</kbd>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-3">
              {searching && items.length === 0 && (
                <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
                  {pending || term.length < 2 ? 'Blijf typen…' : 'Geen resultaten.'}
                </p>
              )}

              {sections.map((section) => (
                <div key={section.label} className="mb-3 last:mb-0">
                  <p className="px-1 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{section.label}</p>
                  {searching ? (
                    <div className="space-y-0.5">
                      {section.entries.map(({ item, index }) => (
                        <ResultRow key={item.id} item={item} active={index === activeIndex} onHover={() => setActiveIndex(index)} onPick={() => go(item.href)} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {section.entries.map(({ item, index }) => (
                        <ActionCard key={item.id} item={item} active={index === activeIndex} onHover={() => setActiveIndex(index)} onPick={() => go(item.href)} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">↑</kbd>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">↓</kbd> navigeren
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
                  <CornerDownLeft className="size-3" />
                </kbd>{' '}
                openen
              </span>
              <span className="hidden sm:inline">Zoek op nummer met # (bv. #1042)</span>
              <span className="ml-auto flex items-center gap-1">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">Esc</kbd> sluiten
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ActionCard({ item, active, onHover, onPick }: { item: PaletteItem; active: boolean; onHover: () => void; onPick: () => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      data-active={active}
      onClick={onPick}
      onMouseEnter={onHover}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors',
        active ? 'border-[var(--color-brand-green)] bg-accent' : 'border-border bg-card hover:bg-muted'
      )}
    >
      {item.hotkey && (
        <kbd className="absolute top-2 right-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
          {item.hotkey}
        </kbd>
      )}
      {Icon && (
        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-brand-deep)]/10 text-[var(--color-brand-deep)]">
          <Icon className="size-4" />
        </span>
      )}
      <span>
        <span className="block text-sm font-semibold">{item.title}</span>
        <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
      </span>
    </button>
  )
}

function ResultRow({ item, active, onHover, onPick }: { item: PaletteItem; active: boolean; onHover: () => void; onPick: () => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      data-active={active}
      onClick={onPick}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm',
        active ? 'bg-accent text-accent-foreground' : 'text-foreground'
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
      </span>
      {item.hotkey && <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">{item.hotkey}</kbd>}
    </button>
  )
}
