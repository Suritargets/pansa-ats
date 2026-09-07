/**
 * fuzzy-match.test.ts
 * WAT:    Regressietests voor de matching die een AI-OCR-geraden naam (bedrijf/functie)
 *         koppelt aan een bekend record, gedeeld door de losse en bulk digitaliseer-flow.
 */
import { describe, expect, it } from 'vitest'
import { fuzzyMatchId } from '../fuzzy-match'

const list = [
  { id: '1', name: 'Pansa Group' },
  { id: '2', name: 'Staatsolie' },
]

describe('fuzzyMatchId', () => {
  it('returns an empty string when no guess is given', () => {
    expect(fuzzyMatchId(list, undefined)).toBe('')
    expect(fuzzyMatchId(list, '')).toBe('')
    expect(fuzzyMatchId(list, '   ')).toBe('')
  })

  it('matches an exact name case-insensitively', () => {
    expect(fuzzyMatchId(list, 'pansa group')).toBe('1')
    expect(fuzzyMatchId(list, 'PANSA GROUP')).toBe('1')
  })

  it('matches a partial name', () => {
    expect(fuzzyMatchId(list, 'Pansa')).toBe('1')
  })

  it('returns an empty string when nothing matches', () => {
    expect(fuzzyMatchId(list, 'Totally Unrelated NV')).toBe('')
  })

  it('returns an empty string for an empty candidate list', () => {
    expect(fuzzyMatchId([], 'Pansa Group')).toBe('')
  })
})
