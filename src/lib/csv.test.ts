import { describe, expect, it } from 'vitest'
import { csvToObjects, detectDelimiter, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF, cells with comma', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('A,B\r\n1,2')
  })

  it('quotes a value containing a comma, quote, or newline, and escapes embedded quotes', () => {
    expect(toCsv(['A'], [['a,b']])).toBe('A\r\n"a,b"')
    expect(toCsv(['A'], [['say "hi"']])).toBe('A\r\n"say ""hi"""')
    expect(toCsv(['A'], [['line1\nline2']])).toBe('A\r\n"line1\nline2"')
  })

  it('turns null/undefined cells into an empty string', () => {
    expect(toCsv(['A', 'B'], [[null, undefined]])).toBe('A,B\r\n,')
  })

  it('neutralizes formula-injection prefixes with a leading apostrophe', () => {
    // The apostrophe itself is also one of the quote-triggering characters, so the whole
    // value ends up wrapped in quotes too — that's fine, Excel/Sheets still read it as text.
    expect(toCsv(['Notes'], [['=SUM(A1:A2)']])).toBe('Notes\r\n"\'=SUM(A1:A2)"')
    expect(toCsv(['Notes'], [['+1234']])).toBe('Notes\r\n"\'+1234"')
    expect(toCsv(['Notes'], [['@mention']])).toBe('Notes\r\n"\'@mention"')
    expect(toCsv(['Notes'], [['-ok since minus is also a formula lead-in']]))
      .toBe('Notes\r\n"\'-ok since minus is also a formula lead-in"')
  })

  it('does not touch a value that merely contains one of those characters mid-string', () => {
    expect(toCsv(['Notes'], [['total = 5']])).toBe('Notes\r\ntotal = 5')
  })
})

describe('detectDelimiter', () => {
  it('picks comma when the header line has no semicolons', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })

  it('picks semicolon when the header line has more semicolons than commas', () => {
    expect(detectDelimiter('a;b;c\n1,2,3')).toBe(';')
  })

  it('ignores a leading BOM when inspecting the first line', () => {
    expect(detectDelimiter('﻿a;b;c\n1,2,3')).toBe(';')
  })
})

describe('parseCsv', () => {
  it('splits simple rows on the given delimiter', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields containing the delimiter and escaped quotes', () => {
    expect(parseCsv('a,"b,c","say ""hi"""')).toEqual([['a', 'b,c', 'say "hi"']])
  })

  it('handles CRLF and bare LF line endings the same way', () => {
    expect(parseCsv('a,b\r\n1,2\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('skips fully blank lines but keeps a row with at least one non-blank cell', () => {
    expect(parseCsv('a,b\n\n1,2\n   ,  \n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('strips a leading BOM before parsing', () => {
    expect(parseCsv('﻿a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('includes a final row even without a trailing newline', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('csvToObjects', () => {
  it('maps each row to an object keyed by the trimmed header', () => {
    expect(csvToObjects('Naam, E-mail\nJan, jan@example.com')).toEqual([{ Naam: 'Jan', 'E-mail': 'jan@example.com' }])
  })

  it('auto-detects a semicolon-delimited (Dutch Excel) export', () => {
    expect(csvToObjects('Naam;E-mail\nJan;jan@example.com')).toEqual([{ Naam: 'Jan', 'E-mail': 'jan@example.com' }])
  })

  it('fills a missing trailing cell with an empty string rather than throwing', () => {
    expect(csvToObjects('A,B,C\n1,2')).toEqual([{ A: '1', B: '2', C: '' }])
  })

  it('returns an empty array for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })
})

describe('toCsv / parseCsv round-trip', () => {
  it('recovers the original values after escaping and re-parsing, including a formula-like value', () => {
    const headers = ['Naam', 'Notitie']
    const rows = [
      ['Jan "de Bever"', 'line1\nline2, with a comma'],
      ['=HYPERLINK("evil")', 'normaal'],
    ]
    const csv = toCsv(headers, rows)
    const parsed = parseCsv(csv, ',')
    expect(parsed[0]).toEqual(headers)
    expect(parsed[1][0]).toBe('Jan "de Bever"')
    expect(parsed[1][1]).toBe('line1\nline2, with a comma')
    // The formula-injection guard prefixes a literal apostrophe, which round-trips as part of the value.
    expect(parsed[2][0]).toBe('\'=HYPERLINK("evil")')
  })
})
