import { describe, expect, it } from 'vitest'
import { generateToken, hashToken, isTokenUsable, looksLikeToken, tokenExpiresAt, TOKEN_TTL_MS } from './auth-tokens'

describe('generateToken', () => {
  it('produces a 43-character base64url string that looksLikeToken accepts', () => {
    const token = generateToken()
    expect(token).toHaveLength(43)
    expect(looksLikeToken(token)).toBe(true)
  })

  it('never repeats across calls', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()))
    expect(tokens.size).toBe(50)
  })
})

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    expect(hashToken('same-token')).toBe(hashToken('same-token'))
  })

  it('differs between distinct inputs', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
  })

  it('never stores the raw token as its own hash', () => {
    expect(hashToken('plain-value')).not.toBe('plain-value')
  })
})

describe('looksLikeToken', () => {
  it('rejects strings of the wrong length', () => {
    expect(looksLikeToken('a'.repeat(42))).toBe(false)
    expect(looksLikeToken('a'.repeat(44))).toBe(false)
  })

  it('rejects characters outside the base64url alphabet', () => {
    expect(looksLikeToken('a'.repeat(42) + '+')).toBe(false)
    expect(looksLikeToken('a'.repeat(42) + '/')).toBe(false)
    expect(looksLikeToken('; DROP TABLE auth_tokens; --'.padEnd(43, 'a'))).toBe(false)
  })

  it('accepts exactly 43 letters, digits, - and _', () => {
    expect(looksLikeToken('A-9_' + 'a'.repeat(39))).toBe(true)
  })
})

describe('tokenExpiresAt', () => {
  it('adds the invite TTL (72h)', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const expires = tokenExpiresAt('invite', now)
    expect(expires.getTime() - now.getTime()).toBe(TOKEN_TTL_MS.invite)
    expect(expires.toISOString()).toBe('2026-01-04T00:00:00.000Z')
  })

  it('adds the password_reset TTL (1h)', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const expires = tokenExpiresAt('password_reset', now)
    expect(expires.getTime() - now.getTime()).toBe(TOKEN_TTL_MS.password_reset)
    expect(expires.toISOString()).toBe('2026-01-01T01:00:00.000Z')
  })
})

describe('isTokenUsable', () => {
  const now = new Date('2026-01-01T12:00:00.000Z')

  it('is usable when unused and not yet expired', () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: new Date('2026-01-01T13:00:00.000Z') }, now)).toBe(true)
  })

  it('is not usable once used, even if not expired', () => {
    expect(isTokenUsable({ usedAt: new Date('2026-01-01T11:00:00.000Z'), expiresAt: new Date('2026-01-01T13:00:00.000Z') }, now)).toBe(
      false
    )
  })

  it('is not usable past its expiry', () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: new Date('2026-01-01T11:59:59.000Z') }, now)).toBe(false)
  })

  it('is not usable exactly at the expiry instant', () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: now }, now)).toBe(false)
  })
})
