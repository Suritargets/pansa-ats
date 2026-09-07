/**
 * csv.test.ts
 * WAT:    Regressietests voor de CSV-serialisatie/parsing die de payroll-export en de
 *         kandidaat-bulk-import gebruiken — geen externe dependency, dus makkelijk om
 *         per ongeluk kapot te maken (bv. quoting/newline-edge cases).
 */
import { describe, expect, it } from 'vitest'
import { toCsv, parseCsv, csvToObjects } from '../csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toBe('a,b\r\n1,2')
  })

  it('quotes values containing commas, quotes, or newlines', () => {
    const csv = toCsv(['name'], [['Doe, John'], ['Say "hi"'], ['Line1\nLine2']])
    expect(csv).toBe('name\r\n"Doe, John"\r\n"Say ""hi"""\r\n"Line1\nLine2"')
  })

  it('renders null/undefined values as empty strings', () => {
    expect(toCsv(['a'], [[null], [undefined]])).toBe('a\r\n\r\n')
  })
})

describe('parseCsv', () => {
  it('parses a simple CSV', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('handles quoted fields containing commas and escaped quotes', () => {
    expect(parseCsv('name,note\n"Doe, John","Say ""hi"""')).toEqual([
      ['name', 'note'],
      ['Doe, John', 'Say "hi"'],
    ])
  })

  it('handles a quoted field spanning multiple lines', () => {
    expect(parseCsv('note\n"line1\nline2"')).toEqual([['note'], ['line1\nline2']])
  })

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('skips blank lines', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('round-trips values produced by toCsv', () => {
    const original = [['Doe, John'], ['Say "hi"'], ['Line1\nLine2'], ['plain']]
    const csv = toCsv(['note'], original)
    const parsed = parseCsv(csv)
    expect(parsed.slice(1)).toEqual(original)
  })
})

describe('csvToObjects', () => {
  it('maps rows to objects keyed by header, trimming whitespace', () => {
    expect(csvToObjects('first, last\n Jane , Doe ')).toEqual([{ first: 'Jane', last: 'Doe' }])
  })

  it('returns an empty array for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })

  it('fills missing trailing fields with an empty string', () => {
    expect(csvToObjects('a,b,c\n1,2')).toEqual([{ a: '1', b: '2', c: '' }])
  })
})
