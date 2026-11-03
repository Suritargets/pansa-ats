/**
 * service-agreements.ts
 * WAT:    Zuivere rekenregels voor dienstverlenings-overeenkomsten met klanten: einddatum van de lopende periode,
 *         opzegmoment en de staat (doorlopend, loopt, opzegperiode, verlopen).
 * WAAROM: Dezelfde regels voeren de lijst, het klantdossier en de geldigheidspagina; één bron voorkomt verschillen.
 *         Datums zijn ISO-tekst (yyyy-mm-dd), net als elders in het ATS.
 */

import { addDays, addMonths, differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns'
import type { AgreementKind, AgreementStatus } from '../../drizzle/schema'

export const AGREEMENT_KIND_LABELS: Record<AgreementKind, string> = {
  framework: 'Raamovereenkomst',
  secondment: 'Detachering',
  recruitment: 'Werving & selectie',
  payroll: 'Payroll',
  sla: 'SLA',
  nda: 'NDA / geheimhouding',
  other: 'Overig',
}

export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  cancelled: 'Opgezegd',
}

export type AgreementState = 'draft' | 'cancelled' | 'open_ended' | 'running' | 'notice' | 'expired'

export interface AgreementDates {
  status: AgreementStatus
  startDate: string | null
  endDate: string | null
  termMonths: number
  autoRenew: boolean
  noticeDays: number
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/**
 * De einddatum van de periode die nu loopt. Zonder automatisch verlengen is dat gewoon `endDate`;
 * mét automatisch verlengen schuift de einddatum per periode (`termMonths`) op tot hij in de toekomst ligt.
 */
export function currentPeriodEnd(a: Pick<AgreementDates, 'endDate' | 'termMonths' | 'autoRenew'>, today: Date = new Date()): string | null {
  if (!a.endDate) return null
  const end = parseISO(a.endDate)
  if (!isValid(end)) return null
  if (!a.autoRenew || a.termMonths < 1) return a.endDate
  const base = startOfDay(today)
  let next = end
  // Begrensd aantal stappen: een verkeerde datum (jaar 1900) mag de pagina niet laten hangen.
  for (let i = 0; i < 600 && next < base; i++) next = addMonths(next, a.termMonths)
  return iso(next)
}

/** Het laatste moment om op te zeggen: `noticeDays` voor het einde van de lopende periode. */
export function noticeDeadline(a: AgreementDates, today: Date = new Date()): string | null {
  const end = currentPeriodEnd(a, today)
  if (!end) return null
  return iso(addDays(parseISO(end), -a.noticeDays))
}

export function daysLeft(isoDate: string | null, today: Date = new Date()): number | null {
  if (!isoDate) return null
  const d = parseISO(isoDate)
  return isValid(d) ? differenceInCalendarDays(d, startOfDay(today)) : null
}

export function agreementState(a: AgreementDates, today: Date = new Date()): AgreementState {
  if (a.status === 'draft') return 'draft'
  if (a.status === 'cancelled') return 'cancelled'
  const end = currentPeriodEnd(a, today)
  if (!end) return 'open_ended'
  const left = daysLeft(end, today)
  if (left === null) return 'open_ended'
  if (left < 0) return 'expired'
  if (left <= a.noticeDays) return 'notice'
  return 'running'
}

export const STATE_LABELS: Record<AgreementState, string> = {
  draft: 'Concept',
  cancelled: 'Opgezegd',
  open_ended: 'Doorlopend',
  running: 'Loopt',
  notice: 'Opzegperiode',
  expired: 'Verlopen',
}

/** Staten die aandacht vragen (voor dashboard en systeemstatus). */
export const ATTENTION_STATES: AgreementState[] = ['notice', 'expired']
