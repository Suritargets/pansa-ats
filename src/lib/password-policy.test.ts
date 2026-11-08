/**
 * password-policy.test.ts
 * WAT:    Unit tests voor de wachtwoordregels (lengte, bcrypt-byte-limiet, niet gelijk aan e-mail).
 */

import { describe, expect, it } from 'vitest'
import { MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH, validatePassword } from './password-policy'

describe('validatePassword', () => {
  it('accepteert een wachtwoord dat aan alle regels voldoet', () => {
    expect(validatePassword('correct-horse-battery')).toBeNull()
  })

  it('weigert een wachtwoord dat te kort is', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toMatch(`minimaal ${MIN_PASSWORD_LENGTH} tekens`)
  })

  it('accepteert een wachtwoord op precies de minimale lengte', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull()
  })

  it('weigert een wachtwoord dat te veel bytes gebruikt (bcrypt knipt stilletjes af)', () => {
    expect(validatePassword('a'.repeat(MAX_PASSWORD_BYTES + 1))).toMatch('te lang')
  })

  it('accepteert een wachtwoord op precies de maximale bytegrens', () => {
    expect(validatePassword('a'.repeat(MAX_PASSWORD_BYTES))).toBeNull()
  })

  it('telt multi-byte tekens (bv. emoji) als meerdere bytes mee', () => {
    // Elk emoji-teken is 4 bytes in UTF-8; 20 stuks = 80 bytes, boven de limiet van 72.
    const password = '😀'.repeat(20)
    expect(validatePassword(password)).toMatch('te lang')
  })

  it('weigert een wachtwoord van alleen spaties', () => {
    expect(validatePassword(' '.repeat(MIN_PASSWORD_LENGTH))).toMatch('alleen uit spaties')
  })

  it('weigert een wachtwoord gelijk aan het e-mailadres (ongeacht hoofdletters)', () => {
    expect(validatePassword('Jan@Pansa.com', 'jan@pansa.com')).toMatch('e-mailadres')
  })

  it('accepteert een wachtwoord dat toevallig op het e-mailadres lijkt maar niet gelijk is', () => {
    expect(validatePassword('jan@pansa.com-extra', 'jan@pansa.com')).toBeNull()
  })
})
