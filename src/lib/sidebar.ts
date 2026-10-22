/**
 * sidebar.ts
 * WAT:    Leest de UI-status van de admin-sidebar uit cookies: in/uitgeklapt, en welke menugroepen
 *         open staan (gewone server-only reads; de setters staan in sidebar-actions.ts).
 * WAAROM: Cookie i.p.v. localStorage zodat de eerste server-render al klopt (geen "flits" van
 *         open/dichte groepen en geen hydration-verschil).
 */

import 'server-only'
import { cookies } from 'next/headers'

export const SIDEBAR_COOKIE_NAME = 'pansa_sidebar_collapsed'
export const SIDEBAR_GROUPS_COOKIE_NAME = 'pansa_sidebar_groups'

export async function getSidebarCollapsed(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === '1'
}

/** Labels van de menugroepen die de gebruiker open heeft gezet (standaard: geen). */
export async function getSidebarOpenGroups(): Promise<string[]> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SIDEBAR_GROUPS_COOKIE_NAME)?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').slice(0, 20) : []
  } catch {
    return []
  }
}
