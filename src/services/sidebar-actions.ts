'use server'

/**
 * sidebar-actions.ts
 * WAT:    Zet het in/uitgeklapt-cookie voor de admin-sidebar.
 */

import { cookies } from 'next/headers'
import { SIDEBAR_COOKIE_NAME } from '@/lib/sidebar'

export async function setSidebarCollapsedAction(collapsed: boolean): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SIDEBAR_COOKIE_NAME, collapsed ? '1' : '0', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
