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
import type { EmploymentContract } from '@/types/database'

const TODAY = new Date('2026-11-15T12:00:00Z')

function isoDaysFromToday(days: number): string {
  const d = new Date(TODAY)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('daysUntil', () => {
  it('returns null for a missing date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
    expect(daysUntil('', TODAY)).toBeNull()
  })

  it('returns null for an invalid date string', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('returns 0 for today', () => {
    expect(daysUntil(isoDaysFromToday(0), TODAY)).toBe(0)
  })

  it('returns a positive count for a future date', () => {
    expect(daysUntil(isoDaysFromToday(10), TODAY)).toBe(10)
  })

  it('returns a negative count for a past date', () => {
    expect(daysUntil(isoDaysFromToday(-5), TODAY)).toBe(-5)
  })

  it('ignores the time-of-day component of `today`', () => {
    const laterSameDay = new Date('2026-11-15T23:59:00Z')
    expect(daysUntil(isoDaysFromToday(1), laterSameDay)).toBe(1)
  })
})

describe('expiryLevel', () => {
  it('is "unknown" without a day count', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is "expired" once the day count is negative', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is "soon" from 0 up to and including the warning window', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is "ok" just past the warning window', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('is false without a date', () => {
    expect(needsAttention(null, TODAY)).toBe(false)
  })

  it('is false well before the warning window', () => {
    expect(needsAttention(isoDaysFromToday(EXPIRY_WARNING_DAYS + 1), TODAY)).toBe(false)
  })

  it('is true at the edge of the warning window', () => {
    expect(needsAttention(isoDaysFromToday(EXPIRY_WARNING_DAYS), TODAY)).toBe(true)
  })

  it('is true once expired', () => {
    expect(needsAttention(isoDaysFromToday(-1), TODAY)).toBe(true)
  })
})

describe('describeDays', () => {
  it('renders an em dash without a value', () => {
    expect(describeDays(null)).toBe('—')
  })

  it('renders "vandaag" for zero', () => {
    expect(describeDays(0)).toBe('vandaag')
  })

  it('pluralizes future days correctly', () => {
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(2)).toBe('over 2 dagen')
  })

  it('pluralizes elapsed days correctly', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-3)).toBe('3 dagen verlopen')
  })
})

function makeContract(overrides: Partial<EmploymentContract> = {}): Parameters<typeof probationDeadlines>[0] {
  return {
    stage: 'probation_2m',
    startDate: isoDaysFromToday(0),
    probationWeek4Notes: null,
    probationWeek8Notes: null,
    ...overrides,
  }
}

describe('probationDeadlines', () => {
  it('is empty outside the first (2-month probation) contract stage', () => {
    expect(probationDeadlines(makeContract({ stage: 'term_4m' }), TODAY)).toEqual([])
  })

  it('is empty without a start date', () => {
    expect(probationDeadlines(makeContract({ startDate: null }), TODAY)).toEqual([])
  })

  it('is empty for an unparsable start date', () => {
    expect(probationDeadlines(makeContract({ startDate: 'not-a-date' }), TODAY)).toEqual([])
  })

  it('computes week-4 and week-8 due dates from the start date', () => {
    const start = isoDaysFromToday(-14) // contract started 2 weeks ago
    const [week4, week8] = probationDeadlines(makeContract({ startDate: start }), TODAY)

    expect(week4.week).toBe(4)
    expect(week4.daysLeft).toBe(28 - 14) // due at day 28, 14 already elapsed
    expect(week8.week).toBe(8)
    expect(week8.daysLeft).toBe(56 - 14)
  })

  it('marks a deadline done only when its notes are non-blank', () => {
    const [week4, week8] = probationDeadlines(
      makeContract({ probationWeek4Notes: 'Positieve evaluatie', probationWeek8Notes: '   ' }),
      TODAY
    )
    expect(week4.done).toBe(true)
    expect(week8.done).toBe(false)
  })
})

describe('probationAttention', () => {
  it('excludes deadlines already marked done', () => {
    const start = isoDaysFromToday(-28) // week 4 due today
    const result = probationAttention(makeContract({ startDate: start, probationWeek4Notes: 'done' }), TODAY)
    expect(result.find((d) => d.week === 4)).toBeUndefined()
  })

  it('excludes a deadline further out than the lookahead window', () => {
    const start = isoDaysFromToday(0) // week 4 due in 28 days, far beyond the lookahead
    const result = probationAttention(makeContract({ startDate: start }), TODAY)
    expect(result).toEqual([])
  })

  it('includes a deadline that is overdue', () => {
    const start = isoDaysFromToday(-30) // week 4 was due 2 days ago
    const result = probationAttention(makeContract({ startDate: start }), TODAY)
    expect(result.map((d) => d.week)).toContain(4)
  })

  it('includes a deadline right at the lookahead edge', () => {
    const start = isoDaysFromToday(-(28 - PROBATION_LOOKAHEAD_DAYS)) // week 4 due in exactly PROBATION_LOOKAHEAD_DAYS
    const result = probationAttention(makeContract({ startDate: start }), TODAY)
    expect(result.map((d) => d.week)).toContain(4)
  })
})
