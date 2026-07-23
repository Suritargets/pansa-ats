/**
 * roles.ts
 * WAT:    Gedeelde rol-groepen voor `requireSession(...)`-checks.
 */

export const STAFF_ROLES = ['super_admin', 'hr_staff', 'recruiter'] as const
export const SUPER_ADMIN_ROLES = ['super_admin'] as const
