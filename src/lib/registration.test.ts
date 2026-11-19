import { describe, expect, it } from 'vitest'
import { registrationLabel } from './registration'

describe('registrationLabel', () => {
  it('uses the manual registration number when present', () => {
    expect(registrationLabel({ registrationNumber: '2026-0042', registrationSeq: 7 })).toBe('2026-0042')
  })

  it('trims whitespace around the manual registration number', () => {
    expect(registrationLabel({ registrationNumber: '  2026-0042  ', registrationSeq: 7 })).toBe('2026-0042')
  })

  it('falls back to a zero-padded sequence number when the manual number is null or blank', () => {
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 7 })).toBe('REG-00007')
    expect(registrationLabel({ registrationNumber: '   ', registrationSeq: 7 })).toBe('REG-00007')
  })

  it('does not truncate a sequence number wider than the padding', () => {
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 123456 })).toBe('REG-123456')
  })
})
