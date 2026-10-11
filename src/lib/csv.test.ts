import { describe, expect, it } from 'vitest'
import { csvToObjects, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['Naam', 'Functie'], [['Jan', 'Monteur']])).toBe('Naam,Functie\r\nJan,Monteur')
  })

  it('quotes values containing a comma, quote or newline', () => {
    expect(toCsv(['A'], [['a,b']])).toBe('A\r\n"a,b"')
    expect(toCsv(['A'], [['say "hi"']])).toBe('A\r\n"say ""hi"""')
    expect(toCsv(['A'], [['line1\nline2']])).toBe('A\r\n"line1\nline2"')
  })

  it('renders null/undefined as an empty cell', () => {
    expect(toCsv(['A', 'B'], [[null, undefined]])).toBe('A,B\r\n,')
  })

  // CSV injection: a cell opened in Excel/Sheets/LibreOffice that starts with one of
  // these characters is interpreted as a formula, letting attacker-controlled free-text
  // (e.g. a candidate's coverNote) run code or exfiltrate data when staff open the export.
  describe('formula injection sanitization', () => {
    it.each([
      ['=SUM(A1:A9)', "'=SUM(A1:A9)"],
      ['+1+1', "'+1+1"],
      ['-2+3', "'-2+3"],
      ['@SUM(A1:A2)', "'@SUM(A1:A2)"],
      ['\tmalicious', "'\tmalicious"],
    ])('prefixes %s with a single quote', (input, expected) => {
      expect(toCsv(['A'], [[input]])).toBe(`A\r\n${expected}`)
    })

    it('still CSV-quotes a sanitized value that also contains a comma', () => {
      expect(toCsv(['A'], [['=SUM(A1:A9),extra']])).toBe('A\r\n"\'=SUM(A1:A9),extra"')
    })

    it('leaves ordinary values starting with other characters untouched', () => {
      expect(toCsv(['A'], [['Normale waarde']])).toBe('A\r\nNormale waarde')
      expect(toCsv(['A'], [['(050) 123-4567']])).toBe('A\r\n(050) 123-4567')
    })
  })
})

describe('parseCsv', () => {
  it('parses simple comma-separated rows', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('handles quoted fields with embedded commas and escaped quotes', () => {
    expect(parseCsv('"a,b","say ""hi"""\nc,d')).toEqual([
      ['a,b', 'say "hi"'],
      ['c', 'd'],
    ])
  })

  it('handles CRLF line endings and skips blank rows', () => {
    expect(parseCsv('a,b\r\nc,d\r\n\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('csvToObjects', () => {
  it('maps rows onto trimmed header keys', () => {
    expect(csvToObjects('Naam, Functie\nJan ,Monteur\n')).toEqual([{ Naam: 'Jan', Functie: 'Monteur' }])
  })

  it('returns an empty array for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })
})
