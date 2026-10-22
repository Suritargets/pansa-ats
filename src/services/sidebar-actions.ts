'use server'

/**
 * sidebar-actions.ts
 * WAT:    Zet de sidebar-cookies: in/uitgeklapt en de open menugroepen.
 */

import { cookies } from 'next/headers'
import { SIDEBAR_COOKIE_NAME, SIDEBAR_GROUPS_COOKIE_NAME } from '@/lib/sidebar'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
}

export async function setSidebarCollapsedAction(collapsed: boolean): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SIDEBAR_COOKIE_NAME, collapsed ? '1' : '0', COOKIE_OPTIONS)
}

export async function setSidebarOpenGroupsAction(groups: string[]): Promise<void> {
  const cookieStore = await cookies()
  const safe = groups.filter((g) => typeof g === 'string' && g.length <= 40).slice(0, 20)
  cookieStore.set(SIDEBAR_GROUPS_COOKIE_NAME, JSON.stringify(safe), COOKIE_OPTIONS)
}
