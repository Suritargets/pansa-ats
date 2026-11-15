import { describe, expect, it } from 'vitest'
import { fuzzyMatchId } from './fuzzy-match'

const list = [
  { id: '1', name: 'RGM Suriname N.V.' },
  { id: '2', name: 'Staatsolie' },
]

describe('fuzzyMatchId', () => {
  it('returns an empty string without a guess', () => {
    expect(fuzzyMatchId(list, undefined)).toBe('')
    expect(fuzzyMatchId(list, '')).toBe('')
    expect(fuzzyMatchId(list, '   ')).toBe('')
  })

  it('matches case-insensitively on an exact name', () => {
    expect(fuzzyMatchId(list, 'staatsolie')).toBe('2')
  })

  it('matches when the guess is a substring of a known name', () => {
    expect(fuzzyMatchId(list, 'RGM')).toBe('1')
  })

  it('matches when a known name is a substring of the guess', () => {
    expect(fuzzyMatchId(list, 'Staatsolie Maatschappij Suriname')).toBe('2')
  })

  it('returns an empty string when nothing matches', () => {
    expect(fuzzyMatchId(list, 'Totally Unknown Co')).toBe('')
  })

  it('prefers the exact match over an earlier partial match', () => {
    const ambiguous = [
      { id: 'a', name: 'Pansa' },
      { id: 'b', name: 'Pansa Group' },
    ]
    expect(fuzzyMatchId(ambiguous, 'Pansa Group')).toBe('b')
  })
})
