import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, createUploadToken, verifyUploadToken } from './auth'

test('hashPassword + verifyPassword round-trip', async () => {
  const hash = await hashPassword('correct horse battery staple')
  assert.equal(await verifyPassword('correct horse battery staple', hash), true)
})

test('verifyPassword rejects a wrong password', async () => {
  const hash = await hashPassword('correct horse battery staple')
  assert.equal(await verifyPassword('wrong password', hash), false)
})

test('createUploadToken is deterministic for the same applicationId', () => {
  const applicationId = '11111111-1111-1111-1111-111111111111'
  assert.equal(createUploadToken(applicationId), createUploadToken(applicationId))
})

test('createUploadToken differs across applicationIds', () => {
  const tokenA = createUploadToken('11111111-1111-1111-1111-111111111111')
  const tokenB = createUploadToken('22222222-2222-2222-2222-222222222222')
  assert.notEqual(tokenA, tokenB)
})

test('verifyUploadToken accepts the token bound to its own applicationId', () => {
  const applicationId = '11111111-1111-1111-1111-111111111111'
  const token = createUploadToken(applicationId)
  assert.equal(verifyUploadToken(applicationId, token), true)
})

// Regression guard for the IDOR fixed in e316efd: an upload token minted for one
// application must not authorize an upload against a different application, even
// though the token is a normal-looking hex string an attacker could copy from a URL.
test('verifyUploadToken rejects a token minted for a different applicationId', () => {
  const tokenForOther = createUploadToken('22222222-2222-2222-2222-222222222222')
  assert.equal(verifyUploadToken('11111111-1111-1111-1111-111111111111', tokenForOther), false)
})

test('verifyUploadToken rejects a missing token', () => {
  assert.equal(verifyUploadToken('11111111-1111-1111-1111-111111111111', undefined), false)
})

test('verifyUploadToken rejects a tampered/garbage token without throwing', () => {
  const applicationId = '11111111-1111-1111-1111-111111111111'
  assert.equal(verifyUploadToken(applicationId, 'not-a-real-token'), false)
  assert.equal(verifyUploadToken(applicationId, ''), false)
})
