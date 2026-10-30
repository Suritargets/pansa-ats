/**
 * mail-core.ts
 * WAT:    Pure logica voor de mail-outbox: SMTP-config uit env, backoff-schema, HTML-escaping.
 * WAAROM: Geen database- of nodemailer-import, zodat dit los te testen is (zoals auth-tokens.ts).
 */

export const MAX_ATTEMPTS = 5
/** Een rij die zo lang op 'sending' blijft staan, is door een afgebroken run achtergelaten en mag opnieuw. */
export const STUCK_AFTER_MS = 5 * 60 * 1000
/** Wachttijd vóór poging n+1 nadat poging n is mislukt (1m, 5m, 30m, 2u). */
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000]

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string | null
  pass: string | null
  from: string
}

type Env = Record<string, string | undefined>

/**
 * Leest de SMTP-instellingen. Geeft null als de mail niet (volledig) is ingesteld: host en afzender zijn
 * verplicht, gebruiker en wachtwoord alleen samen. Poort 465 gebruikt direct TLS; andere poorten
 * upgraden via STARTTLS als de server dat aanbiedt.
 */
export function readSmtpConfig(env: Env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim()
  const from = env.SMTP_FROM?.trim()
  if (!host || !from) return null
  const port = env.SMTP_PORT?.trim() ? Number(env.SMTP_PORT.trim()) : 587
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null
  const user = env.SMTP_USER?.trim() || null
  const pass = env.SMTP_PASS || null
  if (Boolean(user) !== Boolean(pass)) return null
  return { host, port, secure: port === 465, user, pass, from: singleLine(from) }
}

/** Wachttijd in ms voordat een mislukte poging opnieuw wordt gedaan; null = geen pogingen meer. */
export function backoffDelayMs(attemptsDone: number): number | null {
  if (attemptsDone >= MAX_ATTEMPTS) return null
  return BACKOFF_MS[Math.min(Math.max(attemptsDone, 1), BACKOFF_MS.length) - 1]
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const LINE_BREAKS = new RegExp('[' + String.fromCharCode(13, 10, 0x2028, 0x2029) + ']+', 'g')

/** Header-waarden (onderwerp, afzender) mogen nooit regeleinden bevatten: voorkomt header-injectie. */
export function singleLine(value: string): string {
  return value.replace(LINE_BREAKS, ' ').trim()
}

export function isPlausibleEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value)
}

/** Korte, veilige weergave van een fout voor in de beheerlijst (geen stacktraces, begrensd). */
export function summarizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return singleLine(message).slice(0, 300)
}
