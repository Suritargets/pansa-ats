'use client'

/**
 * MobileBottomNav.tsx
 * WAT:    Onderbalk met vier tabs voor het kandidaat- en klantportaal op telefoon (verborgen vanaf md).
 *         De actieve tab wordt aan de URL herkend; een tab blijft actief op zijn subpagina's.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Briefcase, ClipboardList, Home, LayoutDashboard, MoreHorizontal, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabIcon } from '@/constants/nav'

const ICONS: Record<TabIcon, LucideIcon> = {
  home: Home,
  jobs: Briefcase,
  applications: ClipboardList,
  profile: User,
  dashboard: LayoutDashboard,
  candidates: Users,
  more: MoreHorizontal,
}

export interface BottomNavItem {
  label: string
  /** Waar de tab naartoe gaat (loginpagina voor een anonieme gebruiker op een beschermde tab). */
  href: string
  /** Pad waarop de tab als actief telt. */
  match: string
  icon: TabIcon
}

export function MobileBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d130e]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon]
          const active = pathname === item.match || pathname.startsWith(`${item.match}/`)
          return (
            <li key={item.match}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-[var(--color-brand-lime)]' : 'text-white/60 hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-11 items-center justify-center rounded-full transition-colors',
                    active && 'bg-[var(--color-brand-green)]/25'
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
