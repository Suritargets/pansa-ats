/**
 * auth.ts
 * WAT:    Staff/client-login via een httpOnly cookie-sessie (JWT, ondertekend met SESSION_SECRET).
 * WAAROM: Vervangt Supabase Auth — Neon heeft geen ingebouwde auth, dus de profiles-tabel
 *         is nu zelf de user-tabel (email + password_hash) en we tekenen onze eigen sessie.
 * GEBRUIK: `const session = await requireSession()` bovenaan elke admin server component/action.
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { createHmac, timingSafeEqual } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { profiles, type UserRole } from '../../drizzle/schema'

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
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(data: SessionData): Promise<void> {
  const token = await new SignJWT({ ...data })
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

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
      companyId: (payload.companyId as string | null) ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Gooit een redirect naar /admin (login) als er geen geldige sessie is.
 * Optioneel: beperk tot specifieke rollen (bv. alleen staff, geen client).
 */
export async function requireSession(allowedRoles?: UserRole[]): Promise<SessionData> {
  const session = await getSession()
  if (!session) redirect('/admin')
  if (allowedRoles && !allowedRoles.includes(session.role)) redirect('/admin')
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

/**
 * Logt in op e-mail + wachtwoord. Geeft de sessiedata terug bij succes, of null bij falen
 * (verkeerd wachtwoord, onbekend account) — geen onderscheid in de foutmelding, om
 * account-enumeratie te voorkomen.
 */
export async function login(email: string, password: string): Promise<SessionData | null> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.email, email.toLowerCase().trim()))
  if (!profile) return null

  const valid = await verifyPassword(password, profile.passwordHash)
  if (!valid) return null

  const session: SessionData = {
    userId: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    companyId: profile.companyId,
  }
  await createSession(session)
  return session
}
