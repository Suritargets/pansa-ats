import { describe, expect, it } from 'vitest'
import { fuzzyMatchId } from './fuzzy-match'

const list = [
  { id: 'c1', name: 'Pansa Group' },
  { id: 'c2', name: 'Pansa Maintenance N.V.' },
  { id: 'c3', name: 'ZIJIN-RGM' },
]

describe('fuzzyMatchId', () => {
  it('returns an empty string for a missing or blank guess', () => {
    expect(fuzzyMatchId(list, undefined)).toBe('')
    expect(fuzzyMatchId(list, '')).toBe('')
    expect(fuzzyMatchId(list, '   ')).toBe('')
  })

  it('matches an exact name case-insensitively', () => {
    expect(fuzzyMatchId(list, 'pansa group')).toBe('c1')
    expect(fuzzyMatchId(list, 'PANSA GROUP')).toBe('c1')
  })

  it('prefers an exact match over a partial match even when both exist', () => {
    // "Pansa Group" is an exact match for c1, and also a substring-relation candidate for itself only.
    expect(fuzzyMatchId(list, '  Pansa Group  ')).toBe('c1')
  })

  it('falls back to a partial match when the guess is a substring of a known name', () => {
    expect(fuzzyMatchId(list, 'maintenance')).toBe('c2')
  })

  it('falls back to a partial match when a known name is a substring of the guess', () => {
    expect(fuzzyMatchId(list, 'zijin-rgm suriname branch')).toBe('c3')
  })

  it('returns an empty string when nothing matches', () => {
    expect(fuzzyMatchId(list, 'totally unrelated co')).toBe('')
  })

  it('returns an empty string for an empty candidate list', () => {
    expect(fuzzyMatchId([], 'pansa')).toBe('')
  })
})
