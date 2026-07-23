/**
 * sidebar.ts
 * WAT:    Leest of de admin-sidebar in/uitgeklapt is (cookie, UI chrome — geen 'use server',
 *         dit is een gewone server-only read, zie sidebar-actions.ts voor de setter).
 */

import 'server-only'
import { cookies } from 'next/headers'

export const SIDEBAR_COOKIE_NAME = 'pansa_sidebar_collapsed'

export async function getSidebarCollapsed(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === '1'
}
