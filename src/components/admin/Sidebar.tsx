'use client'

/**
 * Sidebar.tsx
 * WAT:    Collapsible navigatie voor de staff-admin. Lokale state voor instant toggle,
 *         persisteert async naar een cookie (UI chrome, geen data — geen revalidatePath nodig).
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { setSidebarCollapsedAction } from '@/services/sidebar-actions'
import { ADMIN_NAV } from '@/constants/nav'
import type { UserRole } from '../../../drizzle/schema'

export function Sidebar({
  role,
  initialCollapsed,
}: {
  role: UserRole
  initialCollapsed: boolean
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [, startTransition] = useTransition()
  // Per-groep in-/uitklappen — puur sessie-lokale UI-state, geen persistentie nodig.
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(() => {
      void setSidebarCollapsedAction(next)
    })
  }

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }))
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

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 pb-4">
        {visibleGroups.map((group, groupIndex) => {
          const groupKey = group.label ?? String(groupIndex)
          const groupHasActiveItem = group.items.some(
            (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
          )
          const groupCollapsed = !groupHasActiveItem && Boolean(collapsedGroups[groupKey])

          return (
            <div key={groupKey}>
              {group.label && !collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  className="flex w-full items-center justify-between px-2 pb-1 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60 hover:text-sidebar-foreground/90"
                >
                  {group.label}
                  <ChevronDown className={cn('size-3 transition-transform', groupCollapsed && '-rotate-90')} />
                </button>
              )}
              {(!groupCollapsed || collapsed) && (
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
                            active
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <item.icon className="size-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
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
