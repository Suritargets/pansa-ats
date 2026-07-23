/**
 * cors.ts
 * WAT:    CORS-headers voor /api/v1/* — deze endpoints zijn expliciet bedoeld om vanuit
 *         een andere website (browser-fetch) aangeroepen te worden, dus open voor alle origins.
 */

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(init?.headers ?? {}) },
  })
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
