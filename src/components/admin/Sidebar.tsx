'use client'

/**
 * Sidebar.tsx
 * WAT:    Collapsible navigatie voor de staff-admin. Lokale state voor instant toggle,
 *         persisteert async naar een cookie (UI chrome, geen data — geen revalidatePath nodig).
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { setSidebarCollapsedAction } from '@/services/sidebar-actions'
import type { NavGroup } from '@/constants/nav'
import type { UserRole } from '../../../drizzle/schema'

export function Sidebar({
  groups,
  role,
  initialCollapsed,
}: {
  groups: NavGroup[]
  role: UserRole
  initialCollapsed: boolean
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [, startTransition] = useTransition()
  const pathname = usePathname()

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(() => {
      void setSidebarCollapsedAction(next)
    })
  }

  const visibleGroups = groups.filter((group) => !group.roles || group.roles.includes(role))

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

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.label ?? groupIndex}>
            {group.label && !collapsed && (
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
                {group.label}
              </p>
            )}
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
          </div>
        ))}
      </nav>
    </aside>
  )
}
