import { describe, expect, it, beforeEach } from 'vitest'
import { createUploadToken, verifyUploadToken, hashPassword, verifyPassword } from './auth'

describe('upload token (IDOR guard for the public document-upload flow)', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production'
  })

  it('accepts a token generated for the same application id', () => {
    const applicationId = 'app-123'
    const token = createUploadToken(applicationId)
    expect(verifyUploadToken(applicationId, token)).toBe(true)
  })

  it('rejects a token generated for a different application id', () => {
    const token = createUploadToken('app-123')
    expect(verifyUploadToken('app-456', token)).toBe(false)
  })

  it('rejects a missing token', () => {
    expect(verifyUploadToken('app-123', undefined)).toBe(false)
  })

  it('rejects a tampered token', () => {
    const token = createUploadToken('app-123')
    const tampered = token.slice(0, -1) + (token.at(-1) === '0' ? '1' : '0')
    expect(verifyUploadToken('app-123', tampered)).toBe(false)
  })

  it('rejects an empty-string token', () => {
    expect(verifyUploadToken('app-123', '')).toBe(false)
  })

  it('is deterministic for the same application id', () => {
    expect(createUploadToken('app-123')).toBe(createUploadToken('app-123'))
  })
})

describe('password hashing', () => {
  it('verifies a matching password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple')
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true)
  })

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false)
  })

  it('produces a hash that does not equal the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).not.toBe('correct horse battery staple')
  })
})
