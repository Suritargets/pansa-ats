/**
 * api-keys.ts
 * WAT:    Genereren + verifiëren van publieke API-sleutels (voor /api/v1/*).
 * WAAROM: sha256 i.p.v. bcrypt — de sleutel moet op hash opzoekbaar zijn (elke request),
 *         dat kan niet met een niet-deterministisch hash-algoritme als bcrypt.
 */

import 'server-only'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { apiKeys, type ApiKeyScope } from '../../drizzle/schema'

const KEY_PREFIX = 'pansa_live_'

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = KEY_PREFIX + randomBytes(24).toString('hex')
  return { key, prefix: key.slice(0, KEY_PREFIX.length + 8), hash: hashApiKey(key) }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export interface VerifiedApiKey {
  id: string
  name: string
  scopes: ApiKeyScope[]
}

/** Leest de Bearer-token uit een Request, valideert m.b.t. de vereiste scope. */
export async function verifyApiKey(request: Request, requiredScope: ApiKeyScope): Promise<VerifiedApiKey | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  if (!match) return null

  const rawKey = match[1].trim()
  if (!rawKey.startsWith(KEY_PREFIX)) return null

  const hash = hashApiKey(rawKey)
  const [row] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash))
  if (!row || !row.active) return null

  const provided = Buffer.from(hash)
  const stored = Buffer.from(row.keyHash)
  if (provided.length !== stored.length || !timingSafeEqual(provided, stored)) return null

  const scopes = row.scopes as ApiKeyScope[]
  if (!scopes.includes(requiredScope)) return null

  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id)).catch(() => {})

  return { id: row.id, name: row.name, scopes }
}
