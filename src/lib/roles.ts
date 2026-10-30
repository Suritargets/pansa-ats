/**
 * roles.ts
 * WAT:    Gedeelde rol-groepen voor `requireSession(...)`-checks, plus startpagina en loginpagina per rol.
 */

export const STAFF_ROLES = ['super_admin', 'hr_staff', 'recruiter'] as const
export const SUPER_ADMIN_ROLES = ['super_admin'] as const

/** Startpagina per rol, na inloggen of het instellen van een wachtwoord. */
export const ROLE_HOME = {
  super_admin: '/admin/dashboard',
  hr_staff: '/admin/dashboard',
  recruiter: '/admin/dashboard',
  client: '/client/dashboard',
  candidate: '/candidate/home',
} as const

/** Loginpagina per rol (voor uitloggen en verlopen sessies). */
export const ROLE_LOGIN = {
  super_admin: '/admin',
  hr_staff: '/admin',
  recruiter: '/admin',
  client: '/client',
  candidate: '/candidate',
} as const
