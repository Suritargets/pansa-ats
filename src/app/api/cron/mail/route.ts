/**
 * api/cron/mail/route.ts
 * WAT:    Vercel Cron-endpoint dat de mail-outbox leegmaakt: verstuurt wat wacht, opnieuw geplande mails
 *         en mails die door een afgebroken run zijn blijven hangen.
 * WAAROM: Vangnet naast het directe verzenden via after(). Vercel stuurt `Authorization: Bearer $CRON_SECRET`
 *         mee; zonder CRON_SECRET of met een ander geheim wordt het verzoek geweigerd (faalt dicht).
 */

import { timingSafeEqual } from 'crypto'
import { processOutbox } from '@/lib/mail'

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(header)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await processOutbox({ limit: 50 })
  return Response.json(result)
}
