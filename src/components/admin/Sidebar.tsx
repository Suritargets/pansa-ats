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
import { setSidebarCollapsedAction, setSidebarOpenGroupsAction } from '@/services/sidebar-actions'
import { ADMIN_NAV } from '@/constants/nav'
import type { UserRole } from '../../../drizzle/schema'

export function Sidebar({
  role,
  initialCollapsed,
  initialOpenGroups,
}: {
  role: UserRole
  initialCollapsed: boolean
  initialOpenGroups: string[]
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [openGroups, setOpenGroups] = useState<string[]>(initialOpenGroups)
  const [, startTransition] = useTransition()
  const pathname = usePathname()

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(() => {
      void setSidebarCollapsedAction(next)
    })
  }

  function toggleGroup(label: string) {
    const next = openGroups.includes(label) ? openGroups.filter((g) => g !== label) : [...openGroups, label]
    setOpenGroups(next)
    startTransition(() => {
      void setSidebarOpenGroupsAction(next)
    })
  }

  const visibleGroups = ADMIN_NAV.filter((group) => !group.roles || group.roles.includes(role))

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-150',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        {!collapsed && <span className="font-heading text-lg font-semibold">Pansa ATS</span>}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={collapsed ? 'Uitklappen' : 'Inklappen'}>
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {visibleGroups.map((group, groupIndex) => {
          const groupKey = group.label ?? String(groupIndex)
          const groupHasActiveItem = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
          // Groepen zonder label (Dashboard/Rapportages) staan altijd open; de rest alleen als de gebruiker ze opende.
          // Een ingeklapte sidebar toont alle iconen, daar is er niets om open/dicht te klappen.
          const isOpen = !group.label || collapsed || openGroups.includes(groupKey)

          return (
            <div key={groupKey} className={cn(group.label && 'pt-1')}>
              {group.label && !collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-sidebar-accent',
                    groupHasActiveItem ? 'text-sidebar-foreground' : 'text-sidebar-foreground/75'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {group.label}
                    {groupHasActiveItem && !isOpen && (
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--color-brand-yellow)]" />
                    )}
                  </span>
                  <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
                </button>
              )}
              {isOpen && (
                <ul className={cn('space-y-1', group.label && !collapsed && 'pb-1')}>
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
                          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
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
    </aside>
  )
}
