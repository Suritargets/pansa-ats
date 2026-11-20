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
} from '../contract-monitor'

const TODAY = new Date('2026-11-20T12:00:00Z')

describe('daysUntil', () => {
  it('returns null for a missing date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
  })

  it('returns null for an unparseable date', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('counts whole calendar days, ignoring time of day', () => {
    expect(daysUntil('2026-11-20', TODAY)).toBe(0)
    expect(daysUntil('2026-11-25', TODAY)).toBe(5)
    expect(daysUntil('2026-11-10', TODAY)).toBe(-10)
  })
})

describe('expiryLevel', () => {
  it('treats a missing days value as unknown', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('treats negative days as expired', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('treats the warning window (inclusive) as soon', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('treats anything beyond the warning window as ok', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('flags an expired date', () => {
    expect(needsAttention('2026-01-01', TODAY)).toBe(true)
  })

  it('flags a date inside the warning window', () => {
    expect(needsAttention('2026-12-01', TODAY)).toBe(true)
  })

  it('does not flag a date well in the future', () => {
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

  it('describes a future date, singular and plural', () => {
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
  })

  it('describes an expired date, singular and plural', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })
})

describe('probationDeadlines', () => {
  it('returns nothing outside the first contract stage', () => {
    expect(
      probationDeadlines({ stage: 'permanent', startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)
    ).toEqual([])
  })

  it('returns nothing without a start date', () => {
    expect(
      probationDeadlines({ stage: 'probation_2m', startDate: null, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)
    ).toEqual([])
  })

  it('computes week 4 and week 8 due dates from the start date', () => {
    const [week4, week8] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(week4.week).toBe(4)
    expect(week4.dueDate.toISOString().slice(0, 10)).toBe('2026-10-29')
    expect(week8.week).toBe(8)
    expect(week8.dueDate.toISOString().slice(0, 10)).toBe('2026-11-26')
  })

  it('marks a deadline done only when notes are non-blank', () => {
    const [week4] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-10-01', probationWeek4Notes: '   ', probationWeek8Notes: null },
      TODAY
    )
    expect(week4.done).toBe(false)

    const [week4Done] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-10-01', probationWeek4Notes: 'Voldoet aan de eisen.', probationWeek8Notes: null },
      TODAY
    )
    expect(week4Done.done).toBe(true)
  })
})

describe('probationAttention', () => {
  it('excludes deadlines that already have notes', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2026-10-01', probationWeek4Notes: 'Afgerond.', probationWeek8Notes: null },
      TODAY
    )
    expect(attention.map((d) => d.week)).toEqual([8])
  })

  it('excludes a deadline that is still far in the future', () => {
    // Started today: week 4 (28 days out) and week 8 (56 days out) are both outside the lookahead.
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2026-11-20', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention).toEqual([])
  })

  it('includes a deadline that falls within the lookahead window', () => {
    // Week 4 due date = start + 28 days; pick a start so week 4 lands inside PROBATION_LOOKAHEAD_DAYS.
    const start = new Date(TODAY)
    start.setDate(start.getDate() - (28 - PROBATION_LOOKAHEAD_DAYS))
    const iso = start.toISOString().slice(0, 10)

    const attention = probationAttention({ stage: 'probation_2m', startDate: iso, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)
    expect(attention.map((d) => d.week)).toContain(4)
  })

  it('includes an overdue deadline', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2026-01-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention.map((d) => d.week)).toEqual([4, 8])
    expect(attention.every((d) => d.daysLeft < 0)).toBe(true)
  })
})
