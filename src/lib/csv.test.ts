import { describe, expect, it } from 'vitest'
import { csvToObjects, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toBe('a,b\r\n1,2')
  })

  it('quotes values containing a comma, quote, or newline', () => {
    expect(toCsv(['name'], [['Smith, John']])).toBe('name\r\n"Smith, John"')
    expect(toCsv(['name'], [['Say "hi"']])).toBe('name\r\n"Say ""hi"""')
    expect(toCsv(['name'], [['line1\nline2']])).toBe('name\r\n"line1\nline2"')
  })

  it('neutralizes formula-injection prefixes with a leading apostrophe', () => {
    // The leading apostrophe itself then trips the quoting rule above, so the field
    // comes out quoted too — still safe, since a quoted field starting with ' is text in Excel/Sheets.
    expect(toCsv(['note'], [['=cmd|calc']])).toBe('note\r\n"\'=cmd|calc"')
    expect(toCsv(['note'], [['+1']])).toBe('note\r\n"\'+1"')
    expect(toCsv(['note'], [['-1']])).toBe('note\r\n"\'-1"')
    expect(toCsv(['note'], [['@sum(1)']])).toBe('note\r\n"\'@sum(1)"')
  })

  it('treats null/undefined cells as empty', () => {
    expect(toCsv(['a'], [[null]])).toBe('a\r\n')
    expect(toCsv(['a'], [[undefined]])).toBe('a\r\n')
  })
})

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('handles quoted fields with embedded commas and escaped quotes', () => {
    expect(parseCsv('name,note\n"Smith, John","Say ""hi"""')).toEqual([
      ['name', 'note'],
      ['Smith, John', 'Say "hi"'],
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
  it('maps rows onto trimmed header names', () => {
    expect(csvToObjects('Name, Email\nJohn, john@example.com')).toEqual([{ Name: 'John', Email: 'john@example.com' }])
  })

  it('returns an empty array for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })

  it('fills a missing trailing column with an empty string', () => {
    expect(csvToObjects('a,b,c\n1,2')).toEqual([{ a: '1', b: '2', c: '' }])
  })
})
