/**
 * contract-monitor.ts
 * WAT:    Zuivere rekenregels voor "Contractperiode monitoren" en het RGM-badge-overzicht
 *         (PGC-HR-PR-0501-05): wanneer loopt een contract/badge af, en wanneer zijn de
 *         proeftijdevaluaties op week 4 en week 8 aan de beurt.
 * WAAROM: Dezelfde regels voeren de pagina /admin/contracts en de dashboard-waarschuwingen; één
 *         bron voorkomt dat beide uit elkaar lopen. Datums in de database zijn ISO-tekst (yyyy-mm-dd).
 */

import { addDays, differenceInCalendarDays, isValid, parseISO, startOfDay } from 'date-fns'
import type { EmploymentContract } from '@/types/database'

/** Binnen zoveel dagen vóór de einddatum / badge-vervaldatum waarschuwen we. */
export const EXPIRY_WARNING_DAYS = 30
/** Een proeftijdevaluatie telt als "aan de beurt" zodra de deadline binnen zoveel dagen valt. */
export const PROBATION_LOOKAHEAD_DAYS = 7

/** Dagen tot een ISO-datum (negatief = verlopen), of `null` zonder geldige datum. */
export function daysUntil(iso: string | null | undefined, today: Date = new Date()): number | null {
  if (!iso) return null
  const date = parseISO(iso)
  if (!isValid(date)) return null
  return differenceInCalendarDays(date, startOfDay(today))
}

export type ExpiryLevel = 'expired' | 'soon' | 'ok' | 'unknown'

export function expiryLevel(days: number | null): ExpiryLevel {
  if (days === null) return 'unknown'
  if (days < 0) return 'expired'
  if (days <= EXPIRY_WARNING_DAYS) return 'soon'
  return 'ok'
}

/** Verlopen of binnen `EXPIRY_WARNING_DAYS`: reden voor een waarschuwing. */
export function needsAttention(iso: string | null | undefined, today: Date = new Date()): boolean {
  const level = expiryLevel(daysUntil(iso, today))
  return level === 'expired' || level === 'soon'
}

export function describeDays(days: number | null): string {
  if (days === null) return '—'
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dag' : 'dagen'} verlopen`
  if (days === 0) return 'vandaag'
  return `over ${days} ${days === 1 ? 'dag' : 'dagen'}`
}

export interface ProbationDeadline {
  week: 4 | 8
  dueDate: Date
  daysLeft: number
  done: boolean
}

/**
 * De twee proeftijdevaluaties (week 4 en week 8 na de startdatum). Alleen voor het eerste
 * contractstadium (proeftijd 2 mnd) met een startdatum; anders `[]`.
 */
export function probationDeadlines(
  contract: Pick<EmploymentContract, 'stage' | 'startDate' | 'probationWeek4Notes' | 'probationWeek8Notes'>,
  today: Date = new Date()
): ProbationDeadline[] {
  if (contract.stage !== 'probation_2m' || !contract.startDate) return []
  const start = parseISO(contract.startDate)
  if (!isValid(start)) return []

  const mk = (week: 4 | 8, notes: string | null): ProbationDeadline => {
    const dueDate = addDays(start, week * 7)
    return {
      week,
      dueDate,
      daysLeft: differenceInCalendarDays(dueDate, startOfDay(today)),
      done: Boolean(notes?.trim()),
    }
  }
  return [mk(4, contract.probationWeek4Notes), mk(8, contract.probationWeek8Notes)]
}

/** Open evaluaties waarvan de deadline verstreken is of binnen `PROBATION_LOOKAHEAD_DAYS` valt. */
export function probationAttention(
  contract: Parameters<typeof probationDeadlines>[0],
  today: Date = new Date()
): ProbationDeadline[] {
  return probationDeadlines(contract, today).filter((d) => !d.done && d.daysLeft <= PROBATION_LOOKAHEAD_DAYS)
}
