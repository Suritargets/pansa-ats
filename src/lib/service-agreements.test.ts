/**
 * service-agreements.test.ts
 * WAT:    Unit tests voor de dienstverleningsovereenkomst-regels: lopende periode, opzegmoment
 *         en de afgeleide status (doorlopend, loopt, opzegperiode, verlopen).
 */

import { describe, expect, it } from 'vitest'
import { agreementState, currentPeriodEnd, daysLeft, noticeDeadline, type AgreementDates } from './service-agreements'

const TODAY = new Date('2025-06-15')

function agreement(overrides: Partial<AgreementDates> = {}): AgreementDates {
  return {
    status: 'active',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    termMonths: 12,
    autoRenew: false,
    noticeDays: 30,
    ...overrides,
  }
}

describe('currentPeriodEnd', () => {
  it('geeft null zonder einddatum', () => {
    expect(currentPeriodEnd(agreement({ endDate: null }), TODAY)).toBeNull()
  })

  it('is gewoon de einddatum zonder automatisch verlengen', () => {
    expect(currentPeriodEnd(agreement({ autoRenew: false, endDate: '2025-12-31' }), TODAY)).toBe('2025-12-31')
  })

  it('is gewoon de einddatum als die nog in de toekomst ligt, ook met automatisch verlengen', () => {
    expect(currentPeriodEnd(agreement({ autoRenew: true, endDate: '2025-12-31', termMonths: 12 }), TODAY)).toBe('2025-12-31')
  })

  it('schuift de periode op tot in de toekomst bij automatisch verlengen', () => {
    // Oorspronkelijke einddatum ligt in het verleden; met jaarlijkse verlenging schuift hij naar 2025-12-31.
    expect(currentPeriodEnd(agreement({ autoRenew: true, endDate: '2024-12-31', termMonths: 12 }), TODAY)).toBe('2025-12-31')
  })

  it('schuift meerdere periodes op als dat nodig is', () => {
    // Een kwartaalcontract dat al jaren verlopen is: schuift door tot de eerste toekomstige kwartaalgrens.
    expect(currentPeriodEnd(agreement({ autoRenew: true, endDate: '2020-01-01', termMonths: 3 }), TODAY)).toBe('2025-07-01')
  })

  it('negeert automatisch verlengen bij een ongeldige termijn', () => {
    expect(currentPeriodEnd(agreement({ autoRenew: true, endDate: '2024-01-01', termMonths: 0 }), TODAY)).toBe('2024-01-01')
  })

  it('geeft null bij een ongeldige einddatum', () => {
    expect(currentPeriodEnd(agreement({ endDate: 'geen-datum' }), TODAY)).toBeNull()
  })
})

describe('noticeDeadline', () => {
  it('ligt noticeDays voor het einde van de lopende periode', () => {
    expect(noticeDeadline(agreement({ endDate: '2025-12-31', noticeDays: 30 }), TODAY)).toBe('2025-12-01')
  })

  it('geeft null zonder lopende periode (open einde)', () => {
    expect(noticeDeadline(agreement({ endDate: null }), TODAY)).toBeNull()
  })
})

describe('daysLeft', () => {
  it('telt dagen tot een datum', () => {
    expect(daysLeft('2025-06-20', TODAY)).toBe(5)
  })

  it('geeft null zonder datum', () => {
    expect(daysLeft(null, TODAY)).toBeNull()
  })
})

describe('agreementState', () => {
  it('is draft voor een concept, ongeacht de datums', () => {
    expect(agreementState(agreement({ status: 'draft', endDate: '2020-01-01' }), TODAY)).toBe('draft')
  })

  it('is cancelled voor een opgezegde overeenkomst', () => {
    expect(agreementState(agreement({ status: 'cancelled', endDate: '2030-01-01' }), TODAY)).toBe('cancelled')
  })

  it('is open_ended zonder einddatum', () => {
    expect(agreementState(agreement({ endDate: null }), TODAY)).toBe('open_ended')
  })

  it('is running ver voor het einde van de opzegtermijn', () => {
    expect(agreementState(agreement({ endDate: '2025-12-31', noticeDays: 30 }), TODAY)).toBe('running')
  })

  it('is notice binnen de opzegtermijn', () => {
    expect(agreementState(agreement({ endDate: '2025-07-01', noticeDays: 30 }), TODAY)).toBe('notice')
  })

  it('is expired na de einddatum', () => {
    expect(agreementState(agreement({ endDate: '2025-06-01', autoRenew: false }), TODAY)).toBe('expired')
  })

  it('blijft running na de einddatum als automatisch verlengen de periode opschuift', () => {
    expect(agreementState(agreement({ endDate: '2024-12-31', autoRenew: true, termMonths: 12, noticeDays: 30 }), TODAY)).toBe('running')
  })
})
