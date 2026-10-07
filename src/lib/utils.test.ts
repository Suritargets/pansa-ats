import { describe, expect, it } from 'vitest'
import { formatDate, daysSince } from './utils'

describe('formatDate', () => {
  it('formats a Date in Dutch, day-month-year style', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('15 jan. 2026')
  })

  it('formats an ISO date string', () => {
    expect(formatDate('2026-03-02T00:00:00.000Z')).toMatch(/^\d{1,2} mrt\.? 2026$/)
  })

  it('returns an em dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns an em dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns an em dash for an unparseable string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('daysSince', () => {
  it('returns 0 for the current moment', () => {
    expect(daysSince(new Date())).toBe(0)
  })

  it('returns the number of whole days elapsed', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    expect(daysSince(tenDaysAgo)).toBe(10)
  })

  it('never returns a negative number for a future date', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(daysSince(tomorrow)).toBe(0)
  })

  it('accepts an ISO string', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    expect(daysSince(tenDaysAgo)).toBe(10)
  })
})
