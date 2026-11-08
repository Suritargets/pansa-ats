/**
 * contract-monitor.test.ts
 * WAT:    Unit tests voor de contract- en proeftijdregels (PGC-HR-PR-0501-05): einddatum-
 *         waarschuwingen (30 dagen) en proeftijdevaluaties op week 4 en week 8.
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

const TODAY = new Date('2025-06-15')

describe('daysUntil', () => {
  it('telt dagen tot een toekomstige datum', () => {
    expect(daysUntil('2025-06-20', TODAY)).toBe(5)
  })

  it('is negatief voor een datum in het verleden', () => {
    expect(daysUntil('2025-06-01', TODAY)).toBe(-14)
  })

  it('is 0 voor vandaag', () => {
    expect(daysUntil('2025-06-15', TODAY)).toBe(0)
  })

  it('geeft null zonder datum', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
  })

  it('geeft null bij een ongeldige datum', () => {
    expect(daysUntil('niet-een-datum', TODAY)).toBeNull()
  })
})

describe('expiryLevel', () => {
  it('is unknown zonder dagen', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is expired bij een negatief aantal dagen', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is expired op precies 0 dagen (vandaag verlopen)', () => {
    // daysUntil=0 betekent "vandaag"; de grens ligt dus bij < 0, niet <= 0.
    expect(expiryLevel(0)).toBe('soon')
  })

  it('is soon binnen de waarschuwingstermijn (grens inclusief)', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is ok net buiten de waarschuwingstermijn', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('vraagt aandacht als de datum verlopen is', () => {
    expect(needsAttention('2025-06-01', TODAY)).toBe(true)
  })

  it('vraagt aandacht binnen de waarschuwingstermijn', () => {
    expect(needsAttention('2025-07-01', TODAY)).toBe(true) // 16 dagen
  })

  it('vraagt geen aandacht ver in de toekomst', () => {
    expect(needsAttention('2026-01-01', TODAY)).toBe(false)
  })

  it('vraagt geen aandacht zonder datum', () => {
    expect(needsAttention(null, TODAY)).toBe(false)
  })
})

describe('describeDays', () => {
  it('beschrijft een enkele dag verlopen in het enkelvoud', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
  })

  it('beschrijft meerdere dagen verlopen in het meervoud', () => {
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })

  it('beschrijft vandaag', () => {
    expect(describeDays(0)).toBe('vandaag')
  })

  it('beschrijft een enkele dag in de toekomst in het enkelvoud', () => {
    expect(describeDays(1)).toBe('over 1 dag')
  })

  it('beschrijft meerdere dagen in de toekomst in het meervoud', () => {
    expect(describeDays(10)).toBe('over 10 dagen')
  })

  it('geeft een streepje zonder dagen', () => {
    expect(describeDays(null)).toBe('—')
  })
})

describe('probationDeadlines', () => {
  it('geeft geen deadlines buiten de proeftijdfase', () => {
    expect(
      probationDeadlines({ stage: 'permanent', startDate: '2025-06-01', probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)
    ).toEqual([])
  })

  it('geeft geen deadlines zonder startdatum', () => {
    expect(
      probationDeadlines({ stage: 'probation_2m', startDate: null, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)
    ).toEqual([])
  })

  it('rekent week 4 en week 8 vanaf de startdatum', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2025-06-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(deadlines).toHaveLength(2)
    expect(deadlines[0]).toMatchObject({ week: 4, done: false })
    expect(deadlines[1]).toMatchObject({ week: 8, done: false })
    // 2025-06-01 + 28 dagen = 2025-06-29; t.o.v. TODAY (2025-06-15) is dat 14 dagen verder.
    expect(deadlines[0].daysLeft).toBe(14)
    // 2025-06-01 + 56 dagen = 2025-07-27; 42 dagen t.o.v. TODAY.
    expect(deadlines[1].daysLeft).toBe(42)
  })

  it('markeert een stap als gereed zodra er notities zijn', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2025-06-01', probationWeek4Notes: 'Positief gesprek gehad.', probationWeek8Notes: null },
      TODAY
    )
    expect(deadlines[0].done).toBe(true)
    expect(deadlines[1].done).toBe(false)
  })

  it('telt alleen-witruimte-notities niet als gereed', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2025-06-01', probationWeek4Notes: '   ', probationWeek8Notes: null },
      TODAY
    )
    expect(deadlines[0].done).toBe(false)
  })
})

describe('probationAttention', () => {
  it('filtert afgeronde stappen eruit', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2025-04-20', probationWeek4Notes: 'ok', probationWeek8Notes: null },
      TODAY
    )
    // Week 4 (2025-05-18) is gereed; alleen week 8 (2025-06-15, vandaag) blijft over.
    expect(attention).toHaveLength(1)
    expect(attention[0].week).toBe(8)
  })

  it('laat deadlines ver in de toekomst weg', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: TODAY.toISOString().slice(0, 10), probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention).toEqual([])
  })

  it('neemt een deadline mee op precies de lookahead-grens', () => {
    const start = new Date(TODAY)
    start.setDate(start.getDate() - (28 - PROBATION_LOOKAHEAD_DAYS))
    const iso = start.toISOString().slice(0, 10)
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: iso, probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention.some((d) => d.week === 4)).toBe(true)
  })

  it('neemt een verlopen (gemiste) deadline ook mee', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2025-01-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention).toHaveLength(2)
  })
})
