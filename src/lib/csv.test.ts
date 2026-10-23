import { describe, expect, it } from 'vitest'
import { csvToObjects, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('A,B\r\n1,2')
  })

  it('renders null and undefined cells as empty', () => {
    expect(toCsv(['A'], [[null], [undefined]])).toBe('A\r\n\r\n')
  })

  it('quotes and escapes a value containing a comma or quote', () => {
    expect(toCsv(['A'], [['a,b']])).toBe('A\r\n"a,b"')
    expect(toCsv(['A'], [['say "hi"']])).toBe('A\r\n"say ""hi"""')
  })

  it('quotes a value containing a newline', () => {
    expect(toCsv(['A'], [['line1\nline2']])).toBe('A\r\n"line1\nline2"')
  })

  it('neutralizes formula-injection prefixes with a leading apostrophe', () => {
    // The leading apostrophe itself then triggers quoting (it matches the quote-escape regex too).
    expect(toCsv(['A'], [['=SUM(A1:A2)']])).toBe('A\r\n"\'=SUM(A1:A2)"')
    expect(toCsv(['A'], [['+1234']])).toBe('A\r\n"\'+1234"')
    expect(toCsv(['A'], [['-1234']])).toBe('A\r\n"\'-1234"')
    expect(toCsv(['A'], [['@cmd']])).toBe('A\r\n"\'@cmd"')
  })

  it('leaves an ordinary value with an internal operator untouched', () => {
    expect(toCsv(['A'], [['Pansa - Group']])).toBe('A\r\nPansa - Group')
  })
})

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('A,B\n1,2')).toEqual([
      ['A', 'B'],
      ['1', '2'],
    ])
  })

  it('handles quoted fields containing commas and escaped quotes', () => {
    expect(parseCsv('A,B\n"a,b","say ""hi"""')).toEqual([
      ['A', 'B'],
      ['a,b', 'say "hi"'],
    ])
  })

  it('accepts CRLF and bare LF/CR line endings', () => {
    expect(parseCsv('A,B\r\n1,2\r\n3,4')).toEqual([
      ['A', 'B'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('skips fully blank lines', () => {
    expect(parseCsv('A,B\n1,2\n\n3,4')).toEqual([
      ['A', 'B'],
      ['1', '2'],
      ['3', '4'],
    ])
  })
})

describe('csvToObjects', () => {
  it('maps rows to objects keyed by the trimmed header row', () => {
    expect(csvToObjects(' Naam ,Email\nJan,jan@example.com')).toEqual([{ Naam: 'Jan', Email: 'jan@example.com' }])
  })

  it('returns an empty array for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })

  it('trims cell values and fills a missing trailing cell with an empty string', () => {
    expect(csvToObjects('A,B\n 1 , 2 \n3')).toEqual([
      { A: '1', B: '2' },
      { A: '3', B: '' },
    ])
  })
})
