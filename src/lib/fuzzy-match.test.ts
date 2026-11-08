/**
 * fuzzy-match.test.ts
 * WAT:    Unit tests voor het matchen van een AI-OCR-gok (bedrijf/functie) tegen een bekende lijst.
 */

import { describe, expect, it } from 'vitest'
import { fuzzyMatchId } from './fuzzy-match'

const COMPANIES = [
  { id: '1', name: 'Pansa Group N.V.' },
  { id: '2', name: 'Suritargets' },
  { id: '3', name: 'Staatsolie' },
]

describe('fuzzyMatchId', () => {
  it('geeft een lege string zonder gok', () => {
    expect(fuzzyMatchId(COMPANIES, undefined)).toBe('')
    expect(fuzzyMatchId(COMPANIES, '')).toBe('')
    expect(fuzzyMatchId(COMPANIES, '   ')).toBe('')
  })

  it('matcht exact, ongeacht hoofdletters', () => {
    expect(fuzzyMatchId(COMPANIES, 'suritargets')).toBe('2')
    expect(fuzzyMatchId(COMPANIES, 'SURITARGETS')).toBe('2')
  })

  it('matcht een deel van de naam uit de lijst', () => {
    expect(fuzzyMatchId(COMPANIES, 'Pansa')).toBe('1')
  })

  it('matcht als de gok de hele naam uit de lijst bevat', () => {
    expect(fuzzyMatchId(COMPANIES, 'De firma Staatsolie N.V. Suriname')).toBe('3')
  })

  it('geeft een lege string zonder enige match', () => {
    expect(fuzzyMatchId(COMPANIES, 'Onbekend Bedrijf B.V.')).toBe('')
  })

  it('trimt omringende spaties voor het matchen', () => {
    expect(fuzzyMatchId(COMPANIES, '  Suritargets  ')).toBe('2')
  })

  it('geeft de eerste match bij meerdere kandidaten', () => {
    const list = [
      { id: 'a', name: 'Pansa Noord' },
      { id: 'b', name: 'Pansa Zuid' },
    ]
    expect(fuzzyMatchId(list, 'Pansa')).toBe('a')
  })
})
