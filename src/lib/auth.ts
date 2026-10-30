/**
 * auth.ts
 * WAT:    Staff/client/candidate-login via een httpOnly cookie-sessie (JWT, ondertekend met SESSION_SECRET).
 * WAAROM: Vervangt Supabase Auth — Neon heeft geen ingebouwde auth, dus de profiles-tabel
 *         is nu zelf de user-tabel (email + password_hash) en we tekenen onze eigen sessie.
 *         Het JWT is alleen een sleutel: bij elke request wordt het account in de database gecontroleerd
 *         (actief + session_version), zodat deactiveren en wachtwoordwijzigingen direct werken.
 * GEBRUIK: `const session = await requireSession()` bovenaan elke admin server component/action.
 */

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { createHmac, timingSafeEqual } from 'crypto'
import { and, count, eq, gte, lt } from 'drizzle-orm'
import { db, DB_MODE } from './db'
import { logAuditEvent } from './audit'
import { ATTEMPT_RETENTION_DAYS, clientIpFromForwardedFor, isLockedOut, lockoutWindowStart } from './login-throttle'
import { loginAttempts, profiles, type UserRole } from '../../drizzle/schema'

const COOKIE_NAME = 'pansa_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 dagen

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET ontbreekt — zet deze env var voordat je inlogt.')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionData {
  userId: string
  email: string
  fullName: string
  role: UserRole
  companyId: string | null
  clientId: string | null
  candidateId: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(data: SessionData, sessionVersion: number): Promise<void> {
  const token = await new SignJWT({ ...data, sv: sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

function sessionFromProfile(profile: typeof profiles.$inferSelect): SessionData {
  return {
    userId: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    companyId: profile.companyId,
    clientId: profile.clientId,
    candidateId: profile.candidateId,
  }
}

/**
 * Leest de sessie uit de cookie en controleert die bij elke request tegen de database: het account
 * moet nog actief zijn en `session_version` moet kloppen (wordt opgehoogd bij deactiveren, rolwijziging
 * en wachtwoordwijziging). Naam, rol en koppelingen komen uit de database, niet uit het token — een
 * rolwijziging werkt dus meteen. Tokens van vóór deze controle hebben geen `sv` en tellen als versie 1.
 * Zonder database (demo-modus) valt dit terug op de inhoud van het token.
 * `cache` dedupliceert de lookup binnen één request.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  let payload: Awaited<ReturnType<typeof jwtVerify>>['payload']
  try {
    payload = (await jwtVerify(token, getSecretKey())).payload
  } catch {
    return null
  }

  if (DB_MODE === 'demo') {
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
      companyId: (payload.companyId as string | null) ?? null,
      clientId: (payload.clientId as string | null) ?? null,
      candidateId: (payload.candidateId as string | null) ?? null,
    }
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, payload.userId as string))
  if (!profile || !profile.active) return null
  const tokenVersion = typeof payload.sv === 'number' ? payload.sv : 1
  if (tokenVersion !== profile.sessionVersion) return null
  return sessionFromProfile(profile)
})

/**
 * Zet de sessie opnieuw op met de huidige versie — bv. na een wachtwoordwijziging, die alle oude
 * sessies ongeldig maakt (ook die van de gebruiker zelf).
 */
export async function refreshSession(profileId: string): Promise<SessionData | null> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId))
  if (!profile || !profile.active) return null
  const session = sessionFromProfile(profile)
  await createSession(session, profile.sessionVersion)
  return session
}

/**
 * Gooit een redirect naar de loginpagina als er geen geldige sessie is.
 * Optioneel: beperk tot specifieke rollen (bv. alleen staff, geen client/candidate) en/of
 * een ander loginPath voor de client-/candidate-portal (default: staff-login op /admin).
 */
export async function requireSession(allowedRoles?: UserRole[], loginPath = '/admin'): Promise<SessionData> {
  const session = await getSession()
  if (!session) redirect(loginPath)
  if (allowedRoles && !allowedRoles.includes(session.role)) redirect(loginPath)
  return session
}

/**
 * Bindt een document-upload aan de application die zojuist door `submitApplication`
 * is aangemaakt — voorkomt dat iemand die een application-id kent/raadt (bv. uit een
 * gedeelde admin-URL) via de publieke Server Action documenten kan uploaden naar
 * andermans sollicitatie. Staff omzeilt dit via een geldige sessie (zie
 * `uploadApplicationDocument`).
 */
export function createUploadToken(applicationId: string): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET ontbreekt.')
  return createHmac('sha256', secret).update(applicationId).digest('hex')
}

export function verifyUploadToken(applicationId: string, token: string | undefined): boolean {
  if (!token) return false
  try {
    const expected = Buffer.from(createUploadToken(applicationId))
    const provided = Buffer.from(token)
    return expected.length === provided.length && timingSafeEqual(expected, provided)
  } catch {
    return false
  }
}

export type LoginResult = { ok: true; session: SessionData } | { ok: false; reason: 'invalid' | 'locked' }

// Bcrypt-hash van een willekeurige string: onbekende e-mailadressen kosten evenveel tijd als bekende,
// zodat de responstijd niet verraadt welke accounts bestaan.
let dummyHashPromise: Promise<string> | null = null
function getDummyHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash(`dummy-${Math.random()}`, 12)
  return dummyHashPromise
}

/**
 * Logt in op e-mail + wachtwoord. Geen onderscheid tussen verkeerd wachtwoord, onbekend of
 * gedeactiveerd account (account-enumeratie). Na 5 mislukte pogingen per e-mailadres of 20 per IP
 * binnen 15 minuten wordt er geblokkeerd — óók voor e-mailadressen zonder account. Mislukte
 * pogingen komen in de audit-log.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const normalized = email.toLowerCase().trim()
  const ip = clientIpFromForwardedFor((await headers()).get('x-forwarded-for'))
  const windowStart = lockoutWindowStart()

  const failedSince = (column: typeof loginAttempts.email | typeof loginAttempts.ip, value: string) =>
    db
      .select({ n: count() })
      .from(loginAttempts)
      .where(and(eq(column, value), eq(loginAttempts.success, false), gte(loginAttempts.createdAt, windowStart)))

  const [profileRows, emailFailures, ipFailures] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.email, normalized)),
    failedSince(loginAttempts.email, normalized),
    ip ? failedSince(loginAttempts.ip, ip) : Promise.resolve([{ n: 0 }]),
  ])
  if (isLockedOut(emailFailures[0].n, ipFailures[0].n)) return { ok: false, reason: 'locked' }

  const profile = profileRows[0]
  const valid = await verifyPassword(password, profile?.passwordHash ?? (await getDummyHash()))

  if (!profile || !profile.active || !valid) {
    await db.insert(loginAttempts).values({ email: normalized, ip, success: false })
    await logAuditEvent({ userId: null, email: normalized }, 'login_failed', { metadata: { ip } })
    const cutoff = new Date(Date.now() - ATTEMPT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, cutoff))
    return { ok: false, reason: 'invalid' }
  }

  await db.insert(loginAttempts).values({ email: normalized, ip, success: true })
  await db.update(profiles).set({ lastLoginAt: new Date() }).where(eq(profiles.id, profile.id))

  const session = sessionFromProfile(profile)
  await createSession(session, profile.sessionVersion)
  return { ok: true, session }
}
