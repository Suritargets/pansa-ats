import { describe, expect, it } from 'vitest'
import { registrationLabel } from './registration'

describe('registrationLabel', () => {
  it('uses the paper registration number when present', () => {
    expect(registrationLabel({ registrationNumber: 'PGC-0042', registrationSeq: 7 })).toBe('PGC-0042')
  })

  it('trims the paper registration number', () => {
    expect(registrationLabel({ registrationNumber: '  PGC-0042  ', registrationSeq: 7 })).toBe('PGC-0042')
  })

  it('falls back to a zero-padded sequence number when blank or missing', () => {
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 42 })).toBe('REG-00042')
    expect(registrationLabel({ registrationNumber: '   ', registrationSeq: 42 })).toBe('REG-00042')
  })

  it('pads the fallback sequence number to five digits without truncating larger numbers', () => {
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 5 })).toBe('REG-00005')
    expect(registrationLabel({ registrationNumber: null, registrationSeq: 123456 })).toBe('REG-123456')
  })
})
