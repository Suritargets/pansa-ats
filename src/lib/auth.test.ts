import { describe, expect, it, beforeAll } from 'vitest'
import { createUploadToken, verifyUploadToken } from './auth'

describe('upload token (binds a public document upload to one application)', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production'
  })

  it('accepts a token generated for the same application id', () => {
    const token = createUploadToken('application-1')
    expect(verifyUploadToken('application-1', token)).toBe(true)
  })

  it('rejects a token generated for a different application id', () => {
    const token = createUploadToken('application-1')
    expect(verifyUploadToken('application-2', token)).toBe(false)
  })

  it('rejects a missing token', () => {
    expect(verifyUploadToken('application-1', undefined)).toBe(false)
  })

  it('rejects an empty token', () => {
    expect(verifyUploadToken('application-1', '')).toBe(false)
  })

  it('rejects a garbage/malformed token without throwing', () => {
    expect(verifyUploadToken('application-1', 'not-a-real-token')).toBe(false)
  })

  it('rejects a token for one application reused on another, even with similar ids', () => {
    const token = createUploadToken('11111111-1111-1111-1111-111111111111')
    expect(verifyUploadToken('11111111-1111-1111-1111-111111111112', token)).toBe(false)
  })

  it('is deterministic for the same application id', () => {
    expect(createUploadToken('application-1')).toBe(createUploadToken('application-1'))
  })
})
