import { describe, expect, it } from 'vitest'
import { MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH, validatePassword } from './password-policy'

describe('validatePassword', () => {
  it('rejects a password shorter than the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toMatch(/minimaal/)
  })

  it('accepts a password at exactly the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull()
  })

  it('rejects a password over the bcrypt byte limit', () => {
    expect(validatePassword('a'.repeat(MAX_PASSWORD_BYTES + 1))).toMatch(/te lang/)
  })

  it('counts multi-byte characters by their UTF-8 byte length, not character count', () => {
    // Each '€' is 3 bytes in UTF-8, so 25 of them is 75 bytes — over the 72-byte limit —
    // even though it is only 25 characters, well above MIN_PASSWORD_LENGTH.
    const password = '€'.repeat(25)
    expect(password.length).toBeLessThan(MAX_PASSWORD_BYTES)
    expect(validatePassword(password)).toMatch(/te lang/)
  })

  it('accepts a password within the byte limit', () => {
    expect(validatePassword('a'.repeat(MAX_PASSWORD_BYTES))).toBeNull()
  })

  it('rejects a password that is only whitespace', () => {
    expect(validatePassword(' '.repeat(MIN_PASSWORD_LENGTH))).toMatch(/spaties/)
  })

  it('rejects a password equal to the email, case-insensitively', () => {
    expect(validatePassword('User@Example.com', 'user@example.com')).toMatch(/e-mailadres/)
  })

  it('accepts a password unrelated to the email', () => {
    expect(validatePassword('correct-horse-battery', 'user@example.com')).toBeNull()
  })
})
