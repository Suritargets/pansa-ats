/**
 * service-agreements.test.ts
 * WAT:    Unit tests voor de zuivere rekenregels in service-agreements.ts: einddatum van de lopende
 *         periode (met en zonder automatische verlenging), de opzegdeadline en de afgeleide staat.
 * WAAROM: Dezelfde regels voeren de overeenkomstenlijst, het klantdossier, de geldigheidspagina én de
 *         meldingen op het dashboard — een afwijking hier levert tegenstrijdige schermen op.
 */

import { describe, expect, it } from 'vitest'
import { agreementState, currentPeriodEnd, daysLeft, noticeDeadline, type AgreementDates } from './service-agreements'

const TODAY = new Date('2026-11-09T12:00:00Z')

function dates(overrides: Partial<AgreementDates> = {}): AgreementDates {
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
  it('is null zonder einddatum (doorlopende overeenkomst)', () => {
    expect(currentPeriodEnd(dates({ endDate: null }), TODAY)).toBeNull()
  })

  it('is null bij een ongeldige einddatum', () => {
    expect(currentPeriodEnd(dates({ endDate: 'geen-datum' }), TODAY)).toBeNull()
  })

  it('is gewoon de einddatum zonder automatische verlenging', () => {
    expect(currentPeriodEnd(dates({ endDate: '2026-12-31', autoRenew: false }), TODAY)).toBe('2026-12-31')
  })

  it('is de einddatum zelf als die nog in de toekomst ligt, ook met autoRenew', () => {
    expect(currentPeriodEnd(dates({ endDate: '2026-12-31', autoRenew: true, termMonths: 12 }), TODAY)).toBe('2026-12-31')
  })

  it('schuift één periode op zodra de vorige einddatum al voorbij is', () => {
    // Periode liep af op 2026-06-30; met termMonths=12 en autoRenew wordt dat 2027-06-30.
    expect(currentPeriodEnd(dates({ endDate: '2026-06-30', autoRenew: true, termMonths: 12 }), TODAY)).toBe('2027-06-30')
  })

  it('schuift meerdere periodes op bij een kortere termijn', () => {
    // endDate ligt in het verleden; bij termMonths=6 moet dat telkens 6 maanden opschuiven
    // tot de eerste periode-einddatum die niet meer in het verleden ligt.
    expect(currentPeriodEnd(dates({ endDate: '2024-10-01', autoRenew: true, termMonths: 6 }), TODAY)).toBe('2027-04-01')
  })

  it('negeert autoRenew wanneer termMonths kleiner dan 1 is', () => {
    expect(currentPeriodEnd(dates({ endDate: '2026-01-01', autoRenew: true, termMonths: 0 }), TODAY)).toBe('2026-01-01')
  })

  it('loopt niet vast op een extreem oude datum (begrensd aantal stappen)', () => {
    expect(() => currentPeriodEnd(dates({ endDate: '1900-01-01', autoRenew: true, termMonths: 1 }), TODAY)).not.toThrow()
  })
})

describe('noticeDeadline', () => {
  it('is null zonder lopende periode-einddatum', () => {
    expect(noticeDeadline(dates({ endDate: null }), TODAY)).toBeNull()
  })

  it('ligt noticeDays vóór het einde van de lopende periode', () => {
    expect(noticeDeadline(dates({ endDate: '2026-12-31', noticeDays: 30 }), TODAY)).toBe('2026-12-01')
  })
})

describe('daysLeft', () => {
  it('is null zonder datum of bij een ongeldige datum', () => {
    expect(daysLeft(null, TODAY)).toBeNull()
    expect(daysLeft('onzin', TODAY)).toBeNull()
  })

  it('telt de kalenderdagen tot de datum', () => {
    expect(daysLeft('2026-11-19', TODAY)).toBe(10)
    expect(daysLeft('2026-10-30', TODAY)).toBe(-10)
  })
})

describe('agreementState', () => {
  it('is "draft" voor een conceptovereenkomst, los van de data', () => {
    expect(agreementState(dates({ status: 'draft', endDate: '2020-01-01' }), TODAY)).toBe('draft')
  })

  it('is "cancelled" voor een opgezegde overeenkomst, los van de data', () => {
    expect(agreementState(dates({ status: 'cancelled', endDate: '2030-01-01' }), TODAY)).toBe('cancelled')
  })

  it('is "open_ended" voor een actieve overeenkomst zonder einddatum', () => {
    expect(agreementState(dates({ status: 'active', endDate: null }), TODAY)).toBe('open_ended')
  })

  it('is "running" ruim vóór het einde van de opzegtermijn', () => {
    expect(agreementState(dates({ status: 'active', endDate: '2026-12-31', noticeDays: 30 }), TODAY)).toBe('running')
  })

  it('is "notice" binnen de opzegtermijn', () => {
    expect(agreementState(dates({ status: 'active', endDate: '2026-11-20', noticeDays: 30 }), TODAY)).toBe('notice')
  })

  it('is "expired" voorbij de einddatum zonder automatische verlenging', () => {
    expect(agreementState(dates({ status: 'active', endDate: '2026-10-01', autoRenew: false }), TODAY)).toBe('expired')
  })

  it('is "running" voorbij de oorspronkelijke einddatum wanneer autoRenew de periode al heeft opgeschoven', () => {
    expect(agreementState(dates({ status: 'active', endDate: '2026-10-01', autoRenew: true, termMonths: 12, noticeDays: 30 }), TODAY)).toBe('running')
  })
})
