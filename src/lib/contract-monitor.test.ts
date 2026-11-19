import { format, subDays } from 'date-fns'
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

const TODAY = new Date('2026-06-15T12:00:00Z')

describe('daysUntil', () => {
  it('returns null for a missing date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
    expect(daysUntil('', TODAY)).toBeNull()
  })

  it('returns null for an invalid date', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('counts whole calendar days regardless of time-of-day', () => {
    expect(daysUntil('2026-06-20', TODAY)).toBe(5)
    expect(daysUntil('2026-06-15', TODAY)).toBe(0)
    expect(daysUntil('2026-06-10', TODAY)).toBe(-5)
  })
})

describe('expiryLevel', () => {
  it('is unknown without a date', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is expired for negative days', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('treats day 0 and the warning-window boundary as soon, not expired/ok', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is ok just past the warning window', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('flags an expired or soon-to-expire date', () => {
    expect(needsAttention('2026-06-10', TODAY)).toBe(true)
    expect(needsAttention('2026-07-01', TODAY)).toBe(true)
  })

  it('does not flag a date safely in the future or missing', () => {
    expect(needsAttention('2026-12-01', TODAY)).toBe(false)
    expect(needsAttention(null, TODAY)).toBe(false)
  })
})

describe('describeDays', () => {
  it('handles the missing, today, past and future cases', () => {
    expect(describeDays(null)).toBe('—')
    expect(describeDays(0)).toBe('vandaag')
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })
})

describe('probationDeadlines', () => {
  it('is empty outside the 2-month probation stage or without a start date', () => {
    expect(probationDeadlines({ stage: 'permanent', startDate: '2026-01-01', probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
    expect(probationDeadlines({ stage: 'probation_2m', startDate: null, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('places week 4 and week 8 deadlines exactly 28 and 56 days after the start date', () => {
    const [week4, week8] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-06-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(week4.week).toBe(4)
    expect(week4.dueDate.toISOString().slice(0, 10)).toBe('2026-06-29')
    expect(week8.week).toBe(8)
    expect(week8.dueDate.toISOString().slice(0, 10)).toBe('2026-07-27')
  })

  it('marks a deadline done only when its notes are non-blank', () => {
    const [week4, week8] = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-06-01', probationWeek4Notes: '  ', probationWeek8Notes: 'Positief, doorgaan.' },
      TODAY
    )
    expect(week4.done).toBe(false)
    expect(week8.done).toBe(true)
  })
})

describe('probationAttention', () => {
  it('excludes deadlines already marked done', () => {
    // Pick a start date so week 8's deadline (start + 56 days) falls exactly on TODAY — well
    // inside the lookahead window — while week 4 (start + 28 days, long overdue) is marked done.
    const startDate = format(subDays(TODAY, 56), 'yyyy-MM-dd')
    const contract = { stage: 'probation_2m' as const, startDate, probationWeek4Notes: 'done', probationWeek8Notes: null }
    const attention = probationAttention(contract, TODAY)
    expect(attention.map((d) => d.week)).toEqual([8])
  })

  it('excludes deadlines further out than the lookahead window', () => {
    // Week 4 due 2026-06-29 (14 days out), week 8 due 2026-07-27 (42 days out) from TODAY.
    const contract = { stage: 'probation_2m' as const, startDate: '2026-06-01', probationWeek4Notes: null, probationWeek8Notes: null }
    const attention = probationAttention(contract, TODAY)
    expect(attention).toEqual([])
  })

  it('includes a deadline right at the lookahead boundary and once overdue', () => {
    // Week 4 due date = start + 28 days; pick a start so that due date is exactly
    // PROBATION_LOOKAHEAD_DAYS (7) from TODAY (2026-06-15), i.e. due 2026-06-22.
    expect(PROBATION_LOOKAHEAD_DAYS).toBe(7)
    const atBoundary = probationAttention(
      { stage: 'probation_2m', startDate: '2026-05-25', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(atBoundary.map((d) => d.week)).toContain(4)

    const overdue = probationAttention(
      { stage: 'probation_2m', startDate: '2026-04-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(overdue.map((d) => d.week)).toEqual([4, 8])
  })
})
