/**
 * password-policy.ts
 * WAT:    Eén plek voor de wachtwoordregels bij instellen en wijzigen.
 * WAAROM: bcrypt kapt stil af na 72 bytes — een langer wachtwoord zou dus minder veilig lijken dan het is;
 *         we weigeren dat expliciet. Lengte boven complexiteit (NIST SP 800-63B).
 */

export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_BYTES = 72

export function validatePassword(password: string, email?: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Kies een wachtwoord van minimaal ${MIN_PASSWORD_LENGTH} tekens.`
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return 'Het wachtwoord is te lang (max 72 bytes).'
  if (!password.trim()) return 'Het wachtwoord mag niet alleen uit spaties bestaan.'
  if (email && password.toLowerCase() === email.toLowerCase()) return 'Het wachtwoord mag niet gelijk zijn aan je e-mailadres.'
  return null
}
