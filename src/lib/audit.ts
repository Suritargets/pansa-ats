/**
 * audit.ts
 * WAT:    Schrijft een audit-regel weg (wie deed wat, wanneer) — voor compliance/nazicht.
 * WAAROM: Losse helper zodat elke muterende Server Action met één regel een event kan
 *         loggen, zonder de mutatie zelf te laten falen als het loggen misgaat.
 */

import { db, DB_MODE } from './db'
import { auditLog } from '../../drizzle/schema'
import type { SessionData } from './auth'

export async function logAuditEvent(
  actor: Pick<SessionData, 'userId' | 'email'> | { userId: null; email: string },
  action: string,
  options?: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  if (DB_MODE === 'demo') return
  try {
    await db.insert(auditLog).values({
      actorId: actor.userId,
      actorEmail: actor.email,
      action,
      entityType: options?.entityType ?? null,
      entityId: options?.entityId ?? null,
      metadata: options?.metadata ?? null,
    })
  } catch (error) {
    console.error('[audit.logAuditEvent]', error)
  }
}
