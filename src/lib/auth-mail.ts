/**
 * auth-mail.ts
 * WAT:    Zet de uitnodigings- of resetmail met de eenmalige link in de outbox.
 * WAAROM: De link in een mail wordt alleen gebouwd op een vertrouwde basis-URL (zie getTrustedAppUrl);
 *         ontbreekt die, dan wordt de mail bewust overgeslagen en blijft zichtbaar in het mail-overzicht.
 */

import { getTrustedAppUrl } from './auth-links'
import { TOKEN_TTL_MS } from './auth-tokens'
import { enqueueMail } from './mail'
import type { AuthTokenPurpose } from '../../drizzle/schema'

export async function sendAuthLinkMail(
  profile: { email: string; fullName: string },
  token: string,
  purpose: AuthTokenPurpose,
  createdBy: string | null
): Promise<void> {
  const baseUrl = getTrustedAppUrl()
  const link = `${baseUrl ?? 'https://invalid.invalid'}/wachtwoord-instellen/${token}`
  const skipReason = baseUrl ? undefined : 'APP_URL is niet ingesteld'
  const data =
    purpose === 'invite'
      ? ({ template: 'invite', name: profile.fullName, link, validHours: TOKEN_TTL_MS.invite / 3_600_000 } as const)
      : ({ template: 'password_reset', name: profile.fullName, link, validMinutes: TOKEN_TTL_MS.password_reset / 60_000 } as const)
  await enqueueMail(profile.email, data, { createdBy, skipReason })
}
