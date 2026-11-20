import { describe, expect, it } from 'vitest'
import { csvToObjects, detectDelimiter, parseCsv, toCsv } from '../csv'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('A,B\r\n1,2')
  })

  it('quotes values containing a comma, quote or newline', () => {
    expect(toCsv(['Naam'], [['Jan, de Vries']])).toBe('Naam\r\n"Jan, de Vries"')
    expect(toCsv(['Naam'], [['Zegt "hallo"']])).toBe('Naam\r\n"Zegt ""hallo"""')
    expect(toCsv(['Notitie'], [['regel 1\nregel 2']])).toBe('Notitie\r\n"regel 1\nregel 2"')
  })

  it('neutralizes values that look like spreadsheet formulas', () => {
    expect(toCsv(['Functie'], [['=SUM(A1:A9)']])).toBe('Functie\r\n"\'=SUM(A1:A9)"')
    expect(toCsv(['Functie'], [['+1 234']])).toBe('Functie\r\n"\'+1 234"')
    expect(toCsv(['Functie'], [['-cmd|/c calc']])).toBe('Functie\r\n"\'-cmd|/c calc"')
    expect(toCsv(['Functie'], [['@SUM(1)']])).toBe('Functie\r\n"\'@SUM(1)"')
  })

  it('leaves plain values untouched', () => {
    expect(toCsv(['Functie'], [['Lasser']])).toBe('Functie\r\nLasser')
  })

  it('renders null and undefined as empty cells', () => {
    expect(toCsv(['A', 'B'], [[null, undefined]])).toBe('A,B\r\n,')
  })
})

describe('detectDelimiter', () => {
  it('picks the comma by default', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })

  it('picks the semicolon for a Dutch Excel export', () => {
    expect(detectDelimiter('Voornaam;Achternaam\nJan;Jansen')).toBe(';')
  })

  it('ignores a leading BOM when sniffing', () => {
    expect(detectDelimiter('﻿a;b\n1;2')).toBe(';')
  })
})

describe('parseCsv / csvToObjects', () => {
  it('round-trips simple rows', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('unescapes quoted fields with embedded commas and quotes', () => {
    expect(parseCsv('"Jan, de Vries","Zegt ""hallo"""\n')).toEqual([['Jan, de Vries', 'Zegt "hallo"']])
  })

  it('skips blank lines', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('maps rows onto trimmed header names', () => {
    expect(csvToObjects('Voornaam;Achternaam\nJan;Jansen')).toEqual([{ Voornaam: 'Jan', Achternaam: 'Jansen' }])
  })

  it('returns an empty list for empty input', () => {
    expect(csvToObjects('')).toEqual([])
  })
})
