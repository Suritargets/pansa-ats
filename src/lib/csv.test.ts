/**
 * csv.test.ts
 * WAT:    Unit tests voor de CSV-serialisatie (export) en -parsing (kandidaat-bulk-import),
 *         inclusief de bescherming tegen formule-injectie in Excel/Sheets.
 */

import { describe, expect, it } from 'vitest'
import { csvToObjects, detectDelimiter, parseCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('serialiseert eenvoudige rijen met CRLF', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('A,B\r\n1,2')
  })

  it('zet null en undefined om naar een lege cel', () => {
    expect(toCsv(['A'], [[null], [undefined]])).toBe('A\r\n\r\n')
  })

  it('quote een waarde met een komma', () => {
    expect(toCsv(['A'], [['Rotterdam, Nederland']])).toBe('A\r\n"Rotterdam, Nederland"')
  })

  it('verdubbelt aanhalingstekens binnen een gequote waarde', () => {
    expect(toCsv(['A'], [['Jan "de Vries"']])).toBe('A\r\n"Jan ""de Vries"""')
  })

  it('beschermt tegen formule-injectie met een voorloop-apostrof (en quote die daardoor)', () => {
    // De apostrof zelf triggert de quote-regel, dus de cel komt dubbel beschermd uit toCsv.
    expect(toCsv(['A'], [['=SOM(A1:A2)']])).toBe('A\r\n"\'=SOM(A1:A2)"')
    expect(toCsv(['A'], [['+1']])).toBe('A\r\n"\'+1"')
    expect(toCsv(['A'], [['-1']])).toBe('A\r\n"\'-1"')
    expect(toCsv(['A'], [['@cmd']])).toBe('A\r\n"\'@cmd"')
  })

  it('laat een gewoon getal met een minteken verderop ongemoeid', () => {
    expect(toCsv(['A'], [['bedrag -5']])).toBe('A\r\nbedrag -5')
  })
})

describe('detectDelimiter', () => {
  it('kiest komma als er geen puntkomma is', () => {
    expect(detectDelimiter('A,B,C\n1,2,3')).toBe(',')
  })

  it('kiest puntkomma voor Nederlands Excel-exports', () => {
    expect(detectDelimiter('A;B;C\n1;2;3')).toBe(';')
  })

  it('negeert een BOM aan het begin', () => {
    expect(detectDelimiter('﻿A;B\n1;2')).toBe(';')
  })
})

describe('parseCsv', () => {
  it('parseert een simpele rij', () => {
    expect(parseCsv('a,b,c')).toEqual([['a', 'b', 'c']])
  })

  it('parseert meerdere regels, zowel \\n als \\r\\n', () => {
    expect(parseCsv('a,b\r\nc,d\ne,f')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ])
  })

  it('ontleedt gequote velden met een komma erin', () => {
    expect(parseCsv('"Rotterdam, NL",Jan')).toEqual([['Rotterdam, NL', 'Jan']])
  })

  it('ontleedt een verdubbeld aanhalingsteken binnen een gequote veld', () => {
    expect(parseCsv('"Jan ""de Vries"""')).toEqual([['Jan "de Vries"']])
  })

  it('slaat lege regels over', () => {
    expect(parseCsv('a,b\n\n\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('respecteert het puntkomma-scheidingsteken', () => {
    expect(parseCsv('a;b;c', ';')).toEqual([['a', 'b', 'c']])
  })
})

describe('csvToObjects', () => {
  it('maakt objecten met de eerste rij als kolomnamen', () => {
    expect(csvToObjects('Voornaam,Achternaam\nJan,Jansen')).toEqual([{ Voornaam: 'Jan', Achternaam: 'Jansen' }])
  })

  it('geeft een lege lijst voor lege invoer', () => {
    expect(csvToObjects('')).toEqual([])
  })

  it('herkent automatisch het puntkomma-formaat', () => {
    expect(csvToObjects('Voornaam;Achternaam\nJan;Jansen')).toEqual([{ Voornaam: 'Jan', Achternaam: 'Jansen' }])
  })

  it('trimt kolomnamen en waardes', () => {
    expect(csvToObjects(' Voornaam , Achternaam \n Jan , Jansen ')).toEqual([{ Voornaam: 'Jan', Achternaam: 'Jansen' }])
  })

  it('vult een ontbrekende cel aan het einde van een rij met een lege string', () => {
    expect(csvToObjects('A,B,C\n1,2')).toEqual([{ A: '1', B: '2', C: '' }])
  })
})
