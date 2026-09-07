/**
 * auth.test.ts
 * WAT:    Regressietests voor de upload-token check die voorkomt dat iemand die een
 *         application-id kent/raadt (bv. uit een gedeelde admin-URL) via de publieke
 *         Server Action documenten kan uploaden naar andermans sollicitatie — precies de
 *         klasse IDOR-bug die eerder is uitgeleverd op `/api/documents/[id]`.
 */
import { describe, expect, it, beforeAll } from 'vitest'
import { createUploadToken, verifyUploadToken } from '../auth'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-session-secret-do-not-use-in-production'
})

describe('createUploadToken / verifyUploadToken', () => {
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

  it('rejects an empty token', () => {
    expect(verifyUploadToken('app-123', '')).toBe(false)
  })

  it('rejects a garbage/tampered token without throwing', () => {
    const token = createUploadToken('app-123')
    const tampered = token.slice(0, -1) + (token.at(-1) === '0' ? '1' : '0')
    expect(verifyUploadToken('app-123', tampered)).toBe(false)
  })

  it('rejects a token of a different length without throwing', () => {
    expect(() => verifyUploadToken('app-123', 'short')).not.toThrow()
    expect(verifyUploadToken('app-123', 'short')).toBe(false)
  })

  it('is deterministic for the same application id', () => {
    expect(createUploadToken('app-123')).toBe(createUploadToken('app-123'))
  })

  it('produces different tokens for different application ids', () => {
    expect(createUploadToken('app-123')).not.toBe(createUploadToken('app-456'))
  })
})
