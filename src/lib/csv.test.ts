import { describe, expect, it } from 'vitest'
import { csvToObjects, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('A,B\r\n1,2')
  })

  it('quotes values containing a comma', () => {
    expect(toCsv(['Naam'], [['Jansen, Piet']])).toBe('Naam\r\n"Jansen, Piet"')
  })

  it('quotes values containing a newline', () => {
    expect(toCsv(['Notities'], [['regel1\nregel2']])).toBe('Notities\r\n"regel1\nregel2"')
  })

  it('escapes embedded quotes by doubling them', () => {
    expect(toCsv(['Naam'], [['Piet "de Vries"']])).toBe('Naam\r\n"Piet ""de Vries"""')
  })

  it('renders null/undefined values as an empty field', () => {
    expect(toCsv(['A', 'B'], [[null, undefined]])).toBe('A,B\r\n,')
  })

  it('leaves plain values unquoted', () => {
    expect(toCsv(['A'], [['plain-value-123']])).toBe('A\r\nplain-value-123')
  })
})

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('A,B\r\n1,2\r\n')).toEqual([['A', 'B'], ['1', '2']])
  })

  it('parses quoted fields containing commas', () => {
    expect(parseCsv('Naam\r\n"Jansen, Piet"\r\n')).toEqual([['Naam'], ['Jansen, Piet']])
  })

  it('un-escapes doubled quotes', () => {
    expect(parseCsv('Naam\r\n"Piet ""de Vries"""\r\n')).toEqual([['Naam'], ['Piet "de Vries"']])
  })

  it('skips blank lines', () => {
    expect(parseCsv('A,B\r\n1,2\r\n\r\n3,4\r\n')).toEqual([['A', 'B'], ['1', '2'], ['3', '4']])
  })

  it('round-trips through toCsv for values with mixed special characters', () => {
    const original = [['Jansen, "Piet"', 'line1\nline2', 'plain']]
    const csv = toCsv(['A', 'B', 'C'], original)
    expect(parseCsv(csv)).toEqual([['A', 'B', 'C'], ...original])
  })
})

describe('csvToObjects', () => {
  it('maps rows to objects keyed by header', () => {
    expect(csvToObjects('Voornaam,Achternaam\r\nJan,Jansen\r\n')).toEqual([
      { Voornaam: 'Jan', Achternaam: 'Jansen' },
    ])
  })

  it('returns an empty array for an empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })

  it('trims whitespace around values', () => {
    expect(csvToObjects('Voornaam, Achternaam\r\n Jan , Jansen \r\n')).toEqual([
      { Voornaam: 'Jan', Achternaam: 'Jansen' },
    ])
  })
})
