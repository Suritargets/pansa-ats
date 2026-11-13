import { describe, expect, it } from 'vitest'
import { csvToObjects, detectDelimiter, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('A,B\r\n1,2')
  })

  it('quotes values containing a comma, quote or newline', () => {
    expect(toCsv(['H'], [['a,b']])).toBe('H\r\n"a,b"')
    expect(toCsv(['H'], [['a"b']])).toBe('H\r\n"a""b"')
    expect(toCsv(['H'], [['a\nb']])).toBe('H\r\n"a\nb"')
  })

  it('treats null and undefined cells as empty strings', () => {
    expect(toCsv(['H'], [[null, undefined]])).toBe('H\r\n,')
  })

  // Pansa's export feeds candidate/client free-text straight into Excel/Sheets; a cell that starts
  // with =, +, -, @ or a tab/CR is otherwise executed as a formula there (CSV formula injection).
  it('neutralizes formula-injection prefixes with a leading apostrophe', () => {
    // The apostrophe prefix itself then matches the quoting regex, so the whole cell is
    // additionally wrapped in double quotes — Excel/Sheets still read the leading ' as "make this text".
    expect(toCsv(['H'], [['=SUM(A1:A9)']])).toBe('H\r\n"\'=SUM(A1:A9)"')
    expect(toCsv(['H'], [['+1+1']])).toBe('H\r\n"\'+1+1"')
    expect(toCsv(['H'], [['-1+1']])).toBe('H\r\n"\'-1+1"')
    expect(toCsv(['H'], [['@cmd']])).toBe('H\r\n"\'@cmd"')
  })

  it('does not touch values that merely contain, but do not start with, a formula character', () => {
    expect(toCsv(['H'], [['total=5']])).toBe('H\r\ntotal=5')
  })
})

describe('detectDelimiter', () => {
  it('picks ; when the header line has more semicolons than commas (Dutch Excel)', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })

  it('defaults to , otherwise', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
    expect(detectDelimiter('a\n1')).toBe(',')
  })

  it('ignores a leading BOM', () => {
    expect(detectDelimiter('﻿a;b\n1;2')).toBe(';')
  })
})

describe('parseCsv', () => {
  it('splits simple rows on the given delimiter', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('round-trips a quoted field containing the delimiter and a quote', () => {
    const csv = toCsv(['H1', 'H2'], [['a,b', 'say "hi"']])
    expect(parseCsv(csv)).toEqual([
      ['H1', 'H2'],
      ['a,b', 'say "hi"'],
    ])
  })

  it('handles CRLF and bare LF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\n3,4')).toEqual([
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
})

describe('csvToObjects', () => {
  it('maps rows to objects keyed by the trimmed header', () => {
    expect(csvToObjects('Naam ,E-mail\nJan,jan@example.com')).toEqual([{ Naam: 'Jan', 'E-mail': 'jan@example.com' }])
  })

  it('auto-detects a semicolon-delimited import', () => {
    expect(csvToObjects('Naam;E-mail\nJan;jan@example.com')).toEqual([{ Naam: 'Jan', 'E-mail': 'jan@example.com' }])
  })

  it('returns an empty array for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })
})
