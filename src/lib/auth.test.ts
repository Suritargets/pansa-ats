import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-only-used-in-unit-tests'
})

describe('upload token', () => {
  it('verifies a token created for the same application id', async () => {
    const { createUploadToken, verifyUploadToken } = await import('./auth')
    const applicationId = '11111111-1111-1111-1111-111111111111'
    const token = createUploadToken(applicationId)
    expect(verifyUploadToken(applicationId, token)).toBe(true)
  })

  it('rejects a token issued for a different application id', async () => {
    const { createUploadToken, verifyUploadToken } = await import('./auth')
    const token = createUploadToken('11111111-1111-1111-1111-111111111111')
    expect(verifyUploadToken('22222222-2222-2222-2222-222222222222', token)).toBe(false)
  })

  it('rejects a missing or malformed token', async () => {
    const { verifyUploadToken } = await import('./auth')
    const applicationId = '11111111-1111-1111-1111-111111111111'
    expect(verifyUploadToken(applicationId, undefined)).toBe(false)
    expect(verifyUploadToken(applicationId, 'not-a-real-token')).toBe(false)
  })
})
