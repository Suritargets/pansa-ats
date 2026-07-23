/**
 * webhooks.ts
 * WAT:    Verstuurt uitgaande webhook-events naar geregistreerde endpoints.
 * WAAROM: `after()` stuurt de events pas na het versturen van de response — de mutatie
 *         zelf wacht niet op trage/onbereikbare klant-endpoints.
 */

import { after } from 'next/server'
import { createHmac } from 'crypto'
import { eq } from 'drizzle-orm'
import { db, DB_MODE } from './db'
import { webhookEndpoints, type WebhookEvent } from '../../drizzle/schema'

/** Roep synchroon aan vanuit een Server Action, vóór de return — de dispatch zelf blokkeert niet. */
export function dispatchWebhookEvent(event: WebhookEvent, payload: Record<string, unknown>): void {
  if (DB_MODE === 'demo') return

  after(async () => {
    try {
      const endpoints = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.active, true))
      const targets = endpoints.filter((e) => (e.events as string[]).includes(event))

      const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })

      await Promise.allSettled(
        targets.map(async (endpoint) => {
          const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex')
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Pansa-Signature': signature, 'X-Pansa-Event': event },
            body,
            signal: AbortSignal.timeout(8000),
          })
          if (!response.ok) {
            console.error(`[webhooks] ${endpoint.url} responded ${response.status} for event ${event}`)
          }
        })
      )
    } catch (error) {
      console.error('[webhooks.dispatchWebhookEvent]', error)
    }
  })
}
