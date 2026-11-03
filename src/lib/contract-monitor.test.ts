import { describe, expect, it } from 'vitest'
import {
  EXPIRY_WARNING_DAYS,
  PROBATION_LOOKAHEAD_DAYS,
  daysUntil,
  describeDays,
  expiryLevel,
  needsAttention,
  probationAttention,
  probationDeadlines,
} from './contract-monitor'

const TODAY = new Date('2026-11-03T00:00:00Z')

describe('daysUntil', () => {
  it('returns null without a date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
  })

  it('returns null for an invalid date string', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('counts calendar days to a future date', () => {
    expect(daysUntil('2026-11-13', TODAY)).toBe(10)
  })

  it('is negative for a past date', () => {
    expect(daysUntil('2026-10-24', TODAY)).toBe(-10)
  })

  it('is zero for today', () => {
    expect(daysUntil('2026-11-03', TODAY)).toBe(0)
  })
})

describe('expiryLevel', () => {
  it('is unknown without a day count', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is expired for negative days', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is soon at the warning-window boundary', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is ok just past the warning window', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('flags an expired date', () => {
    expect(needsAttention('2026-10-01', TODAY)).toBe(true)
  })

  it('flags a date within the warning window', () => {
    expect(needsAttention('2026-11-20', TODAY)).toBe(true)
  })

  it('does not flag a date far in the future', () => {
    expect(needsAttention('2027-06-01', TODAY)).toBe(false)
  })

  it('does not flag a missing date', () => {
    expect(needsAttention(null, TODAY)).toBe(false)
  })
})

describe('describeDays', () => {
  it('describes a missing value', () => {
    expect(describeDays(null)).toBe('—')
  })

  it('describes today', () => {
    expect(describeDays(0)).toBe('vandaag')
  })

  it('describes a future day with singular/plural', () => {
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
  })

  it('describes an overdue day with singular/plural', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })
})

const baseContract = {
  stage: 'probation_2m' as const,
  startDate: '2026-10-01',
  probationWeek4Notes: null as string | null,
  probationWeek8Notes: null as string | null,
}

describe('probationDeadlines', () => {
  it('is empty outside the probation stage', () => {
    expect(probationDeadlines({ ...baseContract, stage: 'fixed_term' as never }, TODAY)).toEqual([])
  })

  it('is empty without a start date', () => {
    expect(probationDeadlines({ ...baseContract, startDate: null }, TODAY)).toEqual([])
  })

  it('is empty for an unparsable start date', () => {
    expect(probationDeadlines({ ...baseContract, startDate: 'nope' }, TODAY)).toEqual([])
  })

  it('computes week 4 and week 8 due dates from the start date', () => {
    const [week4, week8] = probationDeadlines(baseContract, TODAY)
    expect(week4.week).toBe(4)
    expect(week4.dueDate.toISOString().slice(0, 10)).toBe('2026-10-29')
    expect(week8.week).toBe(8)
    expect(week8.dueDate.toISOString().slice(0, 10)).toBe('2026-11-26')
  })

  it('marks a deadline done only when its notes are non-blank', () => {
    const [week4, week8] = probationDeadlines(
      { ...baseContract, probationWeek4Notes: '  ', probationWeek8Notes: 'Positieve evaluatie' },
      TODAY
    )
    expect(week4.done).toBe(false)
    expect(week8.done).toBe(true)
  })
})

describe('probationAttention', () => {
  it('surfaces an overdue, undone deadline', () => {
    // Week 4 was due 2026-10-29, five days before TODAY (2026-11-03) — overdue.
    const attention = probationAttention(baseContract, TODAY)
    expect(attention.map((d) => d.week)).toContain(4)
  })

  it('omits a deadline once its notes are filled in', () => {
    const attention = probationAttention({ ...baseContract, probationWeek4Notes: 'Gedaan' }, TODAY)
    expect(attention.map((d) => d.week)).not.toContain(4)
  })

  it('omits a deadline beyond the lookahead window', () => {
    // Start today: week 4 falls 28 days out, well past PROBATION_LOOKAHEAD_DAYS.
    const attention = probationAttention({ ...baseContract, startDate: '2026-11-03' }, TODAY)
    expect(attention).toEqual([])
    expect(PROBATION_LOOKAHEAD_DAYS).toBeLessThan(28)
  })
})
