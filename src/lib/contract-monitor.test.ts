import { describe, expect, it } from 'vitest'
import {
  daysUntil,
  describeDays,
  EXPIRY_WARNING_DAYS,
  expiryLevel,
  needsAttention,
  probationAttention,
  probationDeadlines,
  PROBATION_LOOKAHEAD_DAYS,
} from './contract-monitor'

const TODAY = new Date('2026-06-15T00:00:00.000Z')

describe('daysUntil', () => {
  it('returns null for a missing date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
  })

  it('returns null for an invalid date string', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('returns a positive count for a future date', () => {
    expect(daysUntil('2026-06-20', TODAY)).toBe(5)
  })

  it('returns a negative count for a past date', () => {
    expect(daysUntil('2026-06-10', TODAY)).toBe(-5)
  })

  it('returns 0 for today', () => {
    expect(daysUntil('2026-06-15', TODAY)).toBe(0)
  })
})

describe('expiryLevel', () => {
  it('is "unknown" without a day count', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is "expired" for negative days', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is "soon" at and below the warning threshold', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is "ok" just past the warning threshold', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('flags an already-expired date', () => {
    expect(needsAttention('2026-06-01', TODAY)).toBe(true)
  })

  it('flags a date within the warning window', () => {
    expect(needsAttention('2026-06-20', TODAY)).toBe(true)
  })

  it('does not flag a date safely in the future', () => {
    expect(needsAttention('2026-12-01', TODAY)).toBe(false)
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

  it('pluralizes future days correctly', () => {
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
  })

  it('pluralizes elapsed days correctly', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })
})

describe('probationDeadlines', () => {
  it('returns nothing outside the probation_2m stage', () => {
    expect(probationDeadlines({ stage: 'term_4m', startDate: '2026-06-01', probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('returns nothing without a start date', () => {
    expect(probationDeadlines({ stage: 'probation_2m', startDate: null, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('computes week 4 and week 8 due dates from the start date', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-06-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(deadlines).toHaveLength(2)
    expect(deadlines[0]).toMatchObject({ week: 4, done: false })
    expect(deadlines[0].dueDate.toISOString().slice(0, 10)).toBe('2026-06-29')
    expect(deadlines[1]).toMatchObject({ week: 8, done: false })
    expect(deadlines[1].dueDate.toISOString().slice(0, 10)).toBe('2026-07-27')
  })

  it('marks a deadline done once notes are filled in, but not when blank/whitespace', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-06-01', probationWeek4Notes: 'prima', probationWeek8Notes: '   ' },
      TODAY
    )
    expect(deadlines[0].done).toBe(true)
    expect(deadlines[1].done).toBe(false)
  })
})

describe('probationAttention', () => {
  it('excludes deadlines that are already done', () => {
    const result = probationAttention(
      { stage: 'probation_2m', startDate: '2026-05-18', probationWeek4Notes: 'done', probationWeek8Notes: null },
      TODAY
    )
    // week 4 due 2026-06-15 (done -> excluded), week 8 due 2026-07-13 (not due yet -> excluded)
    expect(result).toEqual([])
  })

  it('includes a deadline that is overdue', () => {
    const result = probationAttention(
      { stage: 'probation_2m', startDate: '2026-04-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(result.some((d) => d.week === 4 && d.daysLeft < 0)).toBe(true)
  })

  it('includes a deadline within the lookahead window but not beyond it', () => {
    // week 4 due date = startDate + 28 days; place it exactly at the lookahead boundary.
    const start = new Date(TODAY)
    start.setUTCDate(start.getUTCDate() - 28 + PROBATION_LOOKAHEAD_DAYS)
    const startIso = start.toISOString().slice(0, 10)

    const atBoundary = probationAttention({ stage: 'probation_2m', startDate: startIso, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)
    expect(atBoundary.some((d) => d.week === 4)).toBe(true)

    const beyondBoundary = probationAttention(
      { stage: 'probation_2m', startDate: new Date(start.getTime() + 86400000).toISOString().slice(0, 10), probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(beyondBoundary.some((d) => d.week === 4)).toBe(false)
  })
})
