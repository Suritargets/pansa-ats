import { describe, expect, it } from 'vitest'
import { agreementState, currentPeriodEnd, daysLeft, noticeDeadline } from './service-agreements'
import type { AgreementDates } from './service-agreements'

const TODAY = new Date('2026-06-15T09:00:00Z')

function agreement(overrides: Partial<AgreementDates>): AgreementDates {
  return {
    status: 'active',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
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

  it('returns the end date as-is when auto-renew is off, even if in the past', () => {
    expect(currentPeriodEnd(agreement({ endDate: '2026-01-01', autoRenew: false }), TODAY)).toBe('2026-01-01')
  })

  it('rolls a past end date forward by whole terms until it is in the future', () => {
    // endDate 2026-01-01 + 12 months = 2027-01-01, already past TODAY (2026-06-15) by one roll? No —
    // 2026-01-01 is before TODAY, one 12-month step lands on 2027-01-01 which is >= TODAY.
    expect(currentPeriodEnd(agreement({ endDate: '2026-01-01', termMonths: 12, autoRenew: true }), TODAY)).toBe('2027-01-01')
  })

  it('rolls forward by multiple terms when several periods have already elapsed', () => {
    // 3-month term, end date far in the past: 2024-01-01 -> needs several 3-month rolls to pass 2026-06-15.
    expect(currentPeriodEnd(agreement({ endDate: '2024-01-01', termMonths: 3, autoRenew: true }), TODAY)).toBe('2026-07-01')
  })

  it('leaves a future end date untouched even with auto-renew on', () => {
    expect(currentPeriodEnd(agreement({ endDate: '2026-12-01', termMonths: 12, autoRenew: true }), TODAY)).toBe('2026-12-01')
  })

  it('does not spin forever on a degenerate termMonths of 0', () => {
    expect(currentPeriodEnd(agreement({ endDate: '2020-01-01', termMonths: 0, autoRenew: true }), TODAY)).toBe('2020-01-01')
  })

  it('returns null for an invalid end date', () => {
    expect(currentPeriodEnd(agreement({ endDate: 'garbage' }), TODAY)).toBeNull()
  })
})

describe('noticeDeadline', () => {
  it('is noticeDays before the current period end', () => {
    expect(noticeDeadline(agreement({ endDate: '2026-12-01', autoRenew: false, noticeDays: 30 }), TODAY)).toBe('2026-11-01')
  })

  it('is null when there is no period end', () => {
    expect(noticeDeadline(agreement({ endDate: null }), TODAY)).toBeNull()
  })
})

describe('daysLeft', () => {
  it('is null without a date or with an invalid one', () => {
    expect(daysLeft(null, TODAY)).toBeNull()
    expect(daysLeft('garbage', TODAY)).toBeNull()
  })

  it('counts whole calendar days', () => {
    expect(daysLeft('2026-06-25', TODAY)).toBe(10)
    expect(daysLeft('2026-06-05', TODAY)).toBe(-10)
  })
})

describe('agreementState', () => {
  it('is draft or cancelled based on status, before any date logic', () => {
    expect(agreementState(agreement({ status: 'draft', endDate: '2020-01-01' }), TODAY)).toBe('draft')
    expect(agreementState(agreement({ status: 'cancelled', endDate: '2099-01-01' }), TODAY)).toBe('cancelled')
  })

  it('is open_ended for an active agreement with no end date', () => {
    expect(agreementState(agreement({ status: 'active', endDate: null }), TODAY)).toBe('open_ended')
  })

  it('is running well before the notice window', () => {
    expect(agreementState(agreement({ endDate: '2026-12-01', noticeDays: 30, autoRenew: false }), TODAY)).toBe('running')
  })

  it('is notice once inside the notice window, and expired once past the end date', () => {
    expect(agreementState(agreement({ endDate: '2026-07-01', noticeDays: 30, autoRenew: false }), TODAY)).toBe('notice')
    expect(agreementState(agreement({ endDate: '2026-06-01', noticeDays: 30, autoRenew: false }), TODAY)).toBe('expired')
  })

  it('an auto-renewing agreement never reports expired for a period in the past', () => {
    expect(agreementState(agreement({ endDate: '2020-01-01', termMonths: 12, autoRenew: true, noticeDays: 30 }), TODAY)).not.toBe('expired')
  })
})
