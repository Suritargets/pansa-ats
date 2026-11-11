import { describe, expect, it } from 'vitest'
import { agreementState, currentPeriodEnd, daysLeft, noticeDeadline, type AgreementDates } from './service-agreements'

const TODAY = new Date('2026-11-11T00:00:00Z')

function agreement(overrides: Partial<AgreementDates> = {}): AgreementDates {
  return {
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    termMonths: 12,
    autoRenew: false,
    noticeDays: 30,
    ...overrides,
  }
}

describe('currentPeriodEnd', () => {
  it('is null without an end date', () => {
    expect(currentPeriodEnd(agreement({ endDate: null }), TODAY)).toBeNull()
  })

  it('without auto-renew, is just the end date (even in the past)', () => {
    expect(currentPeriodEnd(agreement({ endDate: '2026-01-01', autoRenew: false }), TODAY)).toBe('2026-01-01')
  })

  it('with auto-renew, rolls the end date forward by termMonths until it is in the future', () => {
    // Original end date (2026-01-31) is long past; with a 1-month term it should land after `today`.
    const end = currentPeriodEnd(agreement({ endDate: '2026-01-31', termMonths: 1, autoRenew: true }), TODAY)
    expect(end).not.toBeNull()
    expect(new Date(end as string).getTime()).toBeGreaterThan(TODAY.getTime())
  })

  it('with auto-renew but a future end date, does not roll forward', () => {
    expect(currentPeriodEnd(agreement({ endDate: '2027-06-01', termMonths: 12, autoRenew: true }), TODAY)).toBe('2027-06-01')
  })

  it('does not hang on a degenerate termMonths (treated as a fixed end date)', () => {
    expect(currentPeriodEnd(agreement({ endDate: '2020-01-01', termMonths: 0, autoRenew: true }), TODAY)).toBe('2020-01-01')
  })
})

describe('noticeDeadline', () => {
  it('is noticeDays before the current period end', () => {
    expect(noticeDeadline(agreement({ endDate: '2026-12-31', noticeDays: 30, autoRenew: false }), TODAY)).toBe('2026-12-01')
  })

  it('is null without an end date', () => {
    expect(noticeDeadline(agreement({ endDate: null }), TODAY)).toBeNull()
  })
})

describe('daysLeft', () => {
  it('is null without a date', () => {
    expect(daysLeft(null, TODAY)).toBeNull()
  })

  it('counts calendar days to the date', () => {
    expect(daysLeft('2026-12-01', TODAY)).toBe(20)
  })
})

describe('agreementState', () => {
  it('reflects draft and cancelled regardless of dates', () => {
    expect(agreementState(agreement({ status: 'draft', endDate: '2020-01-01' }), TODAY)).toBe('draft')
    expect(agreementState(agreement({ status: 'cancelled', endDate: '2027-01-01' }), TODAY)).toBe('cancelled')
  })

  it('is open_ended for an active agreement with no end date', () => {
    expect(agreementState(agreement({ endDate: null }), TODAY)).toBe('open_ended')
  })

  it('is running when well before the notice window', () => {
    expect(agreementState(agreement({ endDate: '2027-06-01', noticeDays: 30 }), TODAY)).toBe('running')
  })

  it('is notice once inside the notice window', () => {
    expect(agreementState(agreement({ endDate: '2026-12-01', noticeDays: 30 }), TODAY)).toBe('notice')
  })

  it('is expired once the current period has ended', () => {
    expect(agreementState(agreement({ endDate: '2026-11-01', autoRenew: false }), TODAY)).toBe('expired')
  })

  it('an auto-renewing agreement never reports expired', () => {
    expect(agreementState(agreement({ endDate: '2020-01-01', termMonths: 1, autoRenew: true, noticeDays: 30 }), TODAY)).not.toBe('expired')
  })
})
