import { describe, expect, it } from 'vitest'
import {
  describeDays,
  daysUntil,
  EXPIRY_WARNING_DAYS,
  expiryLevel,
  needsAttention,
  probationAttention,
  probationDeadlines,
  PROBATION_LOOKAHEAD_DAYS,
} from './contract-monitor'

const TODAY = new Date('2026-11-05T12:00:00Z')

describe('daysUntil', () => {
  it('returns null for a missing date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
    expect(daysUntil('', TODAY)).toBeNull()
  })

  it('returns null for an unparseable date', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('counts calendar days, ignoring time of day', () => {
    expect(daysUntil('2026-11-05', TODAY)).toBe(0)
    expect(daysUntil('2026-11-15', TODAY)).toBe(10)
    expect(daysUntil('2026-10-26', TODAY)).toBe(-10)
  })
})

describe('expiryLevel', () => {
  it('is unknown without a day count', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is expired once the date is in the past', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is soon from today up to and including the warning window', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is ok just past the warning window', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('is false without a date', () => {
    expect(needsAttention(null, TODAY)).toBe(false)
  })

  it('is false while comfortably outside the warning window', () => {
    const farOut = new Date(TODAY)
    farOut.setDate(farOut.getDate() + EXPIRY_WARNING_DAYS + 1)
    expect(needsAttention(farOut.toISOString().slice(0, 10), TODAY)).toBe(false)
  })

  it('is true inside the warning window and once expired', () => {
    const soon = new Date(TODAY)
    soon.setDate(soon.getDate() + EXPIRY_WARNING_DAYS)
    expect(needsAttention(soon.toISOString().slice(0, 10), TODAY)).toBe(true)

    const past = new Date(TODAY)
    past.setDate(past.getDate() - 1)
    expect(needsAttention(past.toISOString().slice(0, 10), TODAY)).toBe(true)
  })
})

describe('describeDays', () => {
  it('handles the unknown, today, singular and plural cases', () => {
    expect(describeDays(null)).toBe('—')
    expect(describeDays(0)).toBe('vandaag')
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })
})

describe('probationDeadlines', () => {
  const base = { stage: 'probation_2m' as const, startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null }

  it('is empty outside the probation stage', () => {
    expect(probationDeadlines({ ...base, stage: 'term_4m' }, TODAY)).toEqual([])
  })

  it('is empty without a start date', () => {
    expect(probationDeadlines({ ...base, startDate: null }, TODAY)).toEqual([])
  })

  it('is empty when the start date cannot be parsed', () => {
    expect(probationDeadlines({ ...base, startDate: 'invalid' }, TODAY)).toEqual([])
  })

  it('computes week 4 and week 8 due dates from the start date', () => {
    const [week4, week8] = probationDeadlines(base, TODAY)
    expect(week4.week).toBe(4)
    expect(week4.dueDate.toISOString().slice(0, 10)).toBe('2026-10-29')
    expect(week8.week).toBe(8)
    expect(week8.dueDate.toISOString().slice(0, 10)).toBe('2026-11-26')
  })

  it('treats whitespace-only notes as not done', () => {
    const [week4] = probationDeadlines({ ...base, probationWeek4Notes: '   ' }, TODAY)
    expect(week4.done).toBe(false)
  })

  it('treats non-empty notes as done', () => {
    const [week4] = probationDeadlines({ ...base, probationWeek4Notes: 'Voldoet aan de verwachtingen.' }, TODAY)
    expect(week4.done).toBe(true)
  })
})

describe('probationAttention', () => {
  const base = { stage: 'probation_2m' as const, startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null }

  it('excludes evaluations already marked done', () => {
    const attention = probationAttention({ ...base, probationWeek4Notes: 'done', probationWeek8Notes: 'done' }, TODAY)
    expect(attention).toEqual([])
  })

  it('excludes evaluations whose deadline is beyond the lookahead window', () => {
    // Week 8 (due 2026-11-26) is far beyond PROBATION_LOOKAHEAD_DAYS from 2026-11-05.
    const early = new Date('2026-11-05T12:00:00Z')
    const attention = probationAttention(base, early)
    expect(attention.map((d) => d.week)).toEqual([4])
    expect(attention[0].daysLeft).toBeLessThanOrEqual(PROBATION_LOOKAHEAD_DAYS)
  })

  it('includes an overdue, unresolved evaluation', () => {
    const late = new Date('2026-12-01T12:00:00Z')
    const attention = probationAttention(base, late)
    expect(attention.map((d) => d.week)).toEqual([4, 8])
    expect(attention.every((d) => d.daysLeft < 0)).toBe(true)
  })
})
