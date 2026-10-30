/**
 * auth-links.ts
 * WAT:    Database-kant van uitnodigings- en reset-tokens: aanmaken, opzoeken, absolute link bouwen.
 * WAAROM: Los van de Server Actions, zodat deze helpers niet als publiek aanroepbare actie worden
 *         blootgesteld. De logica rond hashen en verloop staat in auth-tokens.ts (pure functies).
 */

import { headers } from 'next/headers'
import { and, eq, isNull, ne } from 'drizzle-orm'
import { db } from './db'
import { generateToken, hashToken, isTokenUsable, looksLikeToken, tokenExpiresAt } from './auth-tokens'
import { authTokens, profiles, type AuthTokenPurpose } from '../../drizzle/schema'

/**
 * Maakt een nieuw token voor een account en maakt eerdere, nog openstaande tokens van hetzelfde
 * soort ongeldig. Geeft het ruwe token terug — dat wordt nergens bewaard en alleen in de link getoond.
 * (Eerst invoegen, dan de rest ongeldig maken: zonder transacties laat een tussentijdse fout zo
 * liever twee geldige tokens achter dan geen enkele.)
 */
export async function issueAuthToken(profileId: string, purpose: AuthTokenPurpose, createdBy: string | null): Promise<string> {
  const token = generateToken()
  const [created] = await db
    .insert(authTokens)
    .values({ profileId, purpose, tokenHash: hashToken(token), expiresAt: tokenExpiresAt(purpose), createdBy })
    .returning({ id: authTokens.id })

  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.profileId, profileId), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt), ne(authTokens.id, created.id)))
  return token
}

/** Zoekt een token op via de hash en geeft het alleen terug als het nog bruikbaar is én het account actief is. */
export async function findUsableToken(rawToken: string) {
  if (!looksLikeToken(rawToken)) return null
  const [row] = await db
    .select({
      id: authTokens.id,
      purpose: authTokens.purpose,
      usedAt: authTokens.usedAt,
      expiresAt: authTokens.expiresAt,
      profileId: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      active: profiles.active,
    })
    .from(authTokens)
    .innerJoin(profiles, eq(profiles.id, authTokens.profileId))
    .where(eq(authTokens.tokenHash, hashToken(rawToken)))
  if (!row || !row.active || !isTokenUsable(row)) return null
  return row
}

/**
 * Basis-URL voor links in uitnodigingen. Voorkeur: APP_URL, dan de productiedomeinnaam van Vercel,
 * pas dan de Host-header van het verzoek — die laatste is door de aanroeper te beïnvloeden, dus voor
 * links die per mail naar anderen gaan hoort APP_URL gezet te zijn.
 */
export async function getAppUrl(): Promise<string> {
  const explicit = process.env.APP_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelHost) return `https://${vercelHost}`
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function buildSetPasswordLink(token: string): Promise<string> {
  return `${await getAppUrl()}/wachtwoord-instellen/${token}`
}
