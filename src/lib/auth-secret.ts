/**
 * auth-secret.ts
 * WAT:    De geheime sleutel waarvan TOTP-geheimen en herstelcodes worden afgeleid.
 * WAAROM: Hergebruikt SESSION_SECRET, zodat er geen tweede env var nodig is.
 */
export function authSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET ontbreekt.')
  return secret
}
