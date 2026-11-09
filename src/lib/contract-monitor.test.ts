/**
 * contract-monitor.test.ts
 * WAT:    Unit tests voor de zuivere rekenregels in contract-monitor.ts: wanneer een contract/badge
 *         als "aandacht nodig" telt, en wanneer de proeftijdevaluaties (week 4 / week 8) aan de beurt zijn.
 * WAAROM: Deze regels voeren zowel /admin/contracts als de dashboard-/meldingen-waarschuwingen —
 *         een fout hier is fout op meerdere schermen tegelijk, en de einddata zijn direct gekoppeld
 *         aan RGM-badge- en proeftijd-compliance.
 */

import { describe, expect, it } from 'vitest'
import {
  daysUntil,
  describeDays,
  expiryLevel,
  needsAttention,
  probationAttention,
  probationDeadlines,
  EXPIRY_WARNING_DAYS,
  PROBATION_LOOKAHEAD_DAYS,
} from './contract-monitor'

const TODAY = new Date('2026-11-09T12:00:00Z')

describe('daysUntil', () => {
  it('is null zonder datum', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
    expect(daysUntil('', TODAY)).toBeNull()
  })

  it('is null bij een ongeldige datum', () => {
    expect(daysUntil('niet-een-datum', TODAY)).toBeNull()
  })

  it('is positief voor een datum in de toekomst', () => {
    expect(daysUntil('2026-11-19', TODAY)).toBe(10)
  })

  it('is 0 voor vandaag', () => {
    expect(daysUntil('2026-11-09', TODAY)).toBe(0)
  })

  it('is negatief voor een datum in het verleden', () => {
    expect(daysUntil('2026-10-30', TODAY)).toBe(-10)
  })

  it('negeert het tijdstip van de dag binnen "today"', () => {
    expect(daysUntil('2026-11-09', new Date('2026-11-09T23:59:59Z'))).toBe(0)
  })
})

describe('expiryLevel', () => {
  it('is "unknown" zonder dagen', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is "expired" bij een negatief aantal dagen', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is "soon" op en binnen de waarschuwingstermijn', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is "ok" net buiten de waarschuwingstermijn', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('is false zonder datum', () => {
    expect(needsAttention(null, TODAY)).toBe(false)
  })

  it('is false ver in de toekomst', () => {
    expect(needsAttention('2027-06-01', TODAY)).toBe(false)
  })

  it('is true binnen de waarschuwingstermijn', () => {
    const soon = new Date(TODAY.getTime() + EXPIRY_WARNING_DAYS * 86400000).toISOString().slice(0, 10)
    expect(needsAttention(soon, TODAY)).toBe(true)
  })

  it('is true wanneer al verlopen', () => {
    expect(needsAttention('2026-01-01', TODAY)).toBe(true)
  })
})

describe('describeDays', () => {
  it('toont een streepje zonder dagen', () => {
    expect(describeDays(null)).toBe('—')
  })

  it('toont "vandaag" bij 0', () => {
    expect(describeDays(0)).toBe('vandaag')
  })

  it('gebruikt enkelvoud/meervoud voor een toekomstige datum', () => {
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
  })

  it('gebruikt enkelvoud/meervoud voor een verlopen datum', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })
})

describe('probationDeadlines', () => {
  it('is leeg buiten de proeftijdfase', () => {
    expect(probationDeadlines({ stage: 'permanent', startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('is leeg zonder startdatum', () => {
    expect(probationDeadlines({ stage: 'probation_2m', startDate: null, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('berekent week 4 en week 8 vanaf de startdatum', () => {
    const [week4, week8] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(week4.week).toBe(4)
    expect(week4.dueDate.toISOString().slice(0, 10)).toBe('2026-10-29')
    expect(week8.week).toBe(8)
    expect(week8.dueDate.toISOString().slice(0, 10)).toBe('2026-11-26')
  })

  it('markeert "done" alleen bij niet-lege notities', () => {
    const [week4, week8] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-10-01', probationWeek4Notes: '  ', probationWeek8Notes: 'Positief, doorgaan' },
      TODAY
    )
    expect(week4.done).toBe(false)
    expect(week8.done).toBe(true)
  })
})

describe('probationAttention', () => {
  it('laat afgeronde evaluaties weg', () => {
    const contract = { stage: 'probation_2m' as const, startDate: '2026-10-01', probationWeek4Notes: 'ok', probationWeek8Notes: 'ok' }
    expect(probationAttention(contract, TODAY)).toEqual([])
  })

  it('laat evaluaties ver in de toekomst weg', () => {
    const contract = { stage: 'probation_2m' as const, startDate: TODAY.toISOString().slice(0, 10), probationWeek4Notes: null, probationWeek8Notes: null }
    // Week 4 (28 dagen) en week 8 (56 dagen) liggen allebei buiten de lookahead van vandaag.
    expect(probationAttention(contract, TODAY)).toEqual([])
  })

  it('toont een open evaluatie binnen de lookahead-termijn', () => {
    // Startdatum zo kiezen dat week 4 (28 dagen) precies binnen de lookahead valt.
    const start = new Date(TODAY.getTime() - (28 - PROBATION_LOOKAHEAD_DAYS) * 86400000)
    const contract = { stage: 'probation_2m' as const, startDate: start.toISOString().slice(0, 10), probationWeek4Notes: null, probationWeek8Notes: null }
    const attention = probationAttention(contract, TODAY)
    expect(attention).toHaveLength(1)
    expect(attention[0].week).toBe(4)
  })

  it('toont een verlopen (negatieve) evaluatie ook', () => {
    const start = new Date(TODAY.getTime() - 100 * 86400000)
    const contract = { stage: 'probation_2m' as const, startDate: start.toISOString().slice(0, 10), probationWeek4Notes: null, probationWeek8Notes: null }
    const attention = probationAttention(contract, TODAY)
    expect(attention).toHaveLength(2)
    expect(attention.every((d) => d.daysLeft < 0)).toBe(true)
  })
})
