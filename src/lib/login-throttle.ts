/**
 * login-throttle.ts
 * WAT:    Pure regels voor het blokkeren van herhaalde mislukte logins.
 * WAAROM: Wordt per e-mailadres (ook als het account niet bestaat — anders lekt de melding welke
 *         accounts er zijn) én per IP toegepast. De tellingen komen uit `login_attempts`.
 */

export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000
export const MAX_FAILURES_PER_EMAIL = 5
export const MAX_FAILURES_PER_IP = 20
export const ATTEMPT_RETENTION_DAYS = 30

export function lockoutWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - LOCKOUT_WINDOW_MS)
}

export function isLockedOut(failuresForEmail: number, failuresForIp: number): boolean {
  return failuresForEmail >= MAX_FAILURES_PER_EMAIL || failuresForIp >= MAX_FAILURES_PER_IP
}

/** Eerste adres uit `x-forwarded-for` (Vercel zet de client-IP vooraan); anders null. */
export function clientIpFromForwardedFor(header: string | null): string | null {
  const first = header?.split(',')[0]?.trim()
  return first ? first.slice(0, 64) : null
}
