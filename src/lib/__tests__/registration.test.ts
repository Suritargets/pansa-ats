import { describe, expect, it } from 'vitest'
import { registrationLabel } from '../registration'

describe('registrationLabel', () => {
  it('uses the paper registration number when present', () => {
    expect(registrationLabel({ registrationNumber: '2026-0317', registrationSeq: 42 })).toBe('2026-0317')
  })

  it('trims whitespace around the paper registration number', () => {
    expect(registrationLabel({ registrationNumber: '  2026-0317  ', registrationSeq: 42 })).toBe('2026-0317')
  })

  it('falls back to the zero-padded sequence number when blank', () => {
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 42 })).toBe('REG-00042')
    expect(registrationLabel({ registrationNumber: '   ', registrationSeq: 7 })).toBe('REG-00007')
  })

  it('does not truncate a sequence number wider than the padding', () => {
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 123456 })).toBe('REG-123456')
  })
})
