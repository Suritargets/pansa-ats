import { format } from 'date-fns'
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

// Built from local y/m/d components (not an ISO string) so this test is immune to the
// runner's time zone — parseISO()/differenceInCalendarDays() both work in local time.
const TODAY = new Date(2026, 9, 23, 12, 0, 0)

describe('daysUntil', () => {
  it('returns null without a date', () => {
    expect(daysUntil(null, TODAY)).toBeNull()
    expect(daysUntil(undefined, TODAY)).toBeNull()
  })

  it('returns null for an invalid date string', () => {
    expect(daysUntil('not-a-date', TODAY)).toBeNull()
  })

  it('counts whole calendar days, ignoring time of day', () => {
    expect(daysUntil('2026-10-23', TODAY)).toBe(0)
    expect(daysUntil('2026-11-02', TODAY)).toBe(10)
  })

  it('is negative for a date in the past', () => {
    expect(daysUntil('2026-10-13', TODAY)).toBe(-10)
  })
})

describe('expiryLevel', () => {
  it('is unknown without a day count', () => {
    expect(expiryLevel(null)).toBe('unknown')
  })

  it('is expired once the date has passed', () => {
    expect(expiryLevel(-1)).toBe('expired')
  })

  it('is soon from 0 up to and including the warning window', () => {
    expect(expiryLevel(0)).toBe('soon')
    expect(expiryLevel(EXPIRY_WARNING_DAYS)).toBe('soon')
  })

  it('is ok just beyond the warning window', () => {
    expect(expiryLevel(EXPIRY_WARNING_DAYS + 1)).toBe('ok')
  })
})

describe('needsAttention', () => {
  it('is false without a date (nothing to warn about)', () => {
    expect(needsAttention(null, TODAY)).toBe(false)
  })

  it('is true for an expired date', () => {
    expect(needsAttention('2026-01-01', TODAY)).toBe(true)
  })

  it('is true right at the edge of the warning window', () => {
    expect(needsAttention('2026-11-22', TODAY)).toBe(true) // 30 days out
  })

  it('is false just past the warning window', () => {
    expect(needsAttention('2026-11-23', TODAY)).toBe(false) // 31 days out
  })
})

describe('describeDays', () => {
  it('renders singular and plural "verlopen"', () => {
    expect(describeDays(-1)).toBe('1 dag verlopen')
    expect(describeDays(-5)).toBe('5 dagen verlopen')
  })

  it('renders "vandaag" for zero', () => {
    expect(describeDays(0)).toBe('vandaag')
  })

  it('renders singular and plural future counts', () => {
    expect(describeDays(1)).toBe('over 1 dag')
    expect(describeDays(5)).toBe('over 5 dagen')
  })

  it('renders an em-dash without a day count', () => {
    expect(describeDays(null)).toBe('—')
  })
})

describe('probationDeadlines', () => {
  it('is empty outside the probation stage', () => {
    expect(probationDeadlines({ stage: 'term_4m', startDate: '2026-10-01', probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('is empty without a start date', () => {
    expect(probationDeadlines({ stage: 'probation_2m', startDate: null, probationWeek4Notes: null, probationWeek8Notes: null }, TODAY)).toEqual([])
  })

  it('computes week 4 and week 8 due dates from the start date', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-09-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(deadlines).toHaveLength(2)
    expect(deadlines[0].week).toBe(4)
    expect(format(deadlines[0].dueDate, 'yyyy-MM-dd')).toBe('2026-09-29')
    expect(deadlines[1].week).toBe(8)
    expect(format(deadlines[1].dueDate, 'yyyy-MM-dd')).toBe('2026-10-27')
  })

  it('marks a deadline done once its notes are filled in', () => {
    const deadlines = probationDeadlines(
      { stage: 'probation_2m', startDate: '2026-09-01', probationWeek4Notes: 'Gaat goed', probationWeek8Notes: '   ' },
      TODAY
    )
    expect(deadlines[0].done).toBe(true) // has notes
    expect(deadlines[1].done).toBe(false) // whitespace-only notes don't count
  })
})

describe('probationAttention', () => {
  it('excludes deadlines that are already done', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2026-09-01', probationWeek4Notes: 'Gaat goed', probationWeek8Notes: null },
      TODAY
    )
    expect(attention.map((d) => d.week)).toEqual([8])
  })

  it('excludes a deadline that is still far in the future', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2026-10-20', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    // week 4 due 2026-11-17, far beyond the lookahead window
    expect(attention).toEqual([])
  })

  it('includes an overdue deadline that is still open', () => {
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: '2026-07-01', probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention.map((d) => d.week)).toEqual([4, 8])
    expect(attention[0].daysLeft).toBeLessThan(0)
  })

  it('includes a deadline right at the lookahead edge', () => {
    // week 4 due date = today + PROBATION_LOOKAHEAD_DAYS
    const start = new Date(TODAY)
    start.setDate(start.getDate() - 28 + PROBATION_LOOKAHEAD_DAYS)
    const attention = probationAttention(
      { stage: 'probation_2m', startDate: format(start, 'yyyy-MM-dd'), probationWeek4Notes: null, probationWeek8Notes: null },
      TODAY
    )
    expect(attention.some((d) => d.week === 4)).toBe(true)
  })
})
