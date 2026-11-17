'use client'

/**
 * Sidebar.tsx
 * WAT:    Collapsible navigatie voor de staff-admin. Menugroepen staan standaard dicht; een groep
 *         die de gebruiker opent blijft open (cookie) tot die hem weer sluit — ook na navigeren.
 *         Lokale state voor een directe reactie, persistentie async naar een cookie (UI chrome,
 *         geen data — geen revalidatePath nodig).
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { setSidebarAutoCollapseAction, setSidebarCollapsedAction, setSidebarOpenGroupsAction } from '@/services/sidebar-actions'
import { ADMIN_NAV } from '@/constants/nav'
import type { UserRole } from '../../../drizzle/schema'

export function Sidebar({
  role,
  initialCollapsed,
  initialOpenGroups,
  initialAutoCollapse = false,
  embedded = false,
}: {
  role: UserRole
  initialCollapsed: boolean
  initialOpenGroups: string[]
  /** Automatisch inklappen: een groep openen sluit de andere; de groep met de huidige pagina blijft open. */
  initialAutoCollapse?: boolean
  /** In het mobiele menu (Sheet): altijd uitgeklapt, zonder inklapknop en zonder eigen breedte. */
  embedded?: boolean
}) {
  const [collapsedState, setCollapsed] = useState(initialCollapsed)
  const collapsed = embedded ? false : collapsedState
  const [openGroups, setOpenGroups] = useState<string[]>(initialOpenGroups)
  const [autoCollapse, setAutoCollapse] = useState(initialAutoCollapse)
  const [, startTransition] = useTransition()
  const pathname = usePathname()
  // Bij een paginawissel in automatische modus: handmatig geopende groepen sluiten (de groep van de nieuwe pagina opent vanzelf).
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    if (autoCollapse) setOpenGroups([])
  }

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(() => {
      void setSidebarCollapsedAction(next)
    })
  }

  function toggleAutoCollapse() {
    const next = !autoCollapse
    setAutoCollapse(next)
    if (next) setOpenGroups([])
    startTransition(() => {
      void setSidebarAutoCollapseAction(next)
      if (next) void setSidebarOpenGroupsAction([])
    })
  }

  function toggleGroup(label: string) {
    const opening = !openGroups.includes(label)
    // Automatisch: alleen deze groep handmatig open (de groep van de huidige pagina blijft vanzelf open).
    const next = autoCollapse ? (opening ? [label] : []) : opening ? [...openGroups, label] : openGroups.filter((g) => g !== label)
    setOpenGroups(next)
    startTransition(() => {
      void setSidebarOpenGroupsAction(next)
    })
  }

  const visibleGroups = ADMIN_NAV.filter((group) => !group.roles || group.roles.includes(role))

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col bg-sidebar text-sidebar-foreground',
        embedded ? 'h-full w-full' : cn('border-r border-sidebar-border transition-[width] duration-150', collapsed ? 'w-16' : 'w-72')
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- statisch bestand uit /public */}
        {!collapsed && <img src="/landing/logo.png" alt="Pansa Group" className="h-10 w-auto" />}
        {!embedded && (
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={collapsed ? 'Uitklappen' : 'Inklappen'}>
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {visibleGroups.map((group, groupIndex) => {
          const groupKey = group.label ?? String(groupIndex)
          const groupHasActiveItem = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
          // Groepen zonder label (Dashboard/Rapportages) staan altijd open; de rest alleen als de gebruiker ze opende.
          // Een ingeklapte sidebar toont alle iconen, daar is er niets om open/dicht te klappen.
          const isOpen = !group.label || collapsed || openGroups.includes(groupKey) || (autoCollapse && groupHasActiveItem)

          return (
            <div
              key={groupKey}
              // Open hoofdmenu: lichtere groen-tint over de hele groep (kop + subitems), zodat duidelijk is wat bij elkaar hoort.
              className={cn(group.label && !collapsed && 'rounded-xl transition-colors', group.label && !collapsed && isOpen && 'bg-sidebar-foreground/[0.08]')}
            >
              {group.label && !collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center justify-between px-2.5 py-2 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-sidebar-accent',
                    isOpen ? 'rounded-t-xl rounded-b-none bg-sidebar-foreground/[0.06]' : 'rounded-xl',
                    groupHasActiveItem ? 'text-sidebar-foreground' : 'text-sidebar-foreground/75'
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5 whitespace-nowrap">
                    {group.icon && <group.icon className="size-[18px] shrink-0" />}
                    {group.label}
                    {groupHasActiveItem && !isOpen && (
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--color-brand-yellow)]" />
                    )}
                  </span>
                  <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
                </button>
              )}
              {isOpen && (
                <ul className={cn('space-y-1', group.label && !collapsed && 'px-1.5 pt-1 pb-1.5')}>
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                            active
                              ? 'bg-primary font-medium text-primary-foreground before:absolute before:inset-y-1.5 before:-left-2 before:w-1 before:rounded-full before:bg-[var(--color-brand-yellow)]'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                          aria-current={active ? 'page' : undefined}
                        >
                          <item.icon className="size-[18px] shrink-0" />
                          {!collapsed && <span className="flex-1 truncate whitespace-nowrap">{item.label}</span>}
                          {!collapsed && active && <ChevronRight className="size-4 shrink-0 opacity-80" />}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={autoCollapse}
            onClick={toggleAutoCollapse}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground"
          >
            <span>
              Menu automatisch inklappen
              <span className="block text-[11px] text-sidebar-foreground/60">Opent één groep, de rest gaat dicht</span>
            </span>
            <span
              aria-hidden="true"
              className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', autoCollapse ? 'bg-[var(--color-brand-yellow)]' : 'bg-sidebar-foreground/25')}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
                  autoCollapse && 'translate-x-4'
                )}
              />
            </span>
          </button>
        </div>
      )}
    </aside>
  )
}
