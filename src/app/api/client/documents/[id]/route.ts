/**
 * api/client/documents/[id]/route.ts
 * WAT:    Streamt een document uit de private Vercel Blob store voor de client-portal.
 * WAAROM: Alleen bereikbaar voor een ingelogde client, en alleen voor documenten die (a)
 *         horen bij een profiel dat expliciet met `session.clientId` gedeeld is
 *         (`getDocumentByIdScoped`) én (b) van een klant-zichtbaar type zijn — ID-bewijs,
 *         bewijs van goed gedrag en de handgeschreven scan blijven intern.
 */

import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { readDocument } from '@/lib/blob'
import { CLIENT_VISIBLE_DOCUMENT_KINDS } from '@/lib/documents'
import { getDocumentByIdScoped } from '@/services/queries'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) {
    return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 403 })
  }

  const { id } = await params
  const doc = await getDocumentByIdScoped(id, { clientId: session.clientId })
  if (!doc || !CLIENT_VISIBLE_DOCUMENT_KINDS.includes(doc.kind)) {
    return NextResponse.json({ error: 'Document niet gevonden.' }, { status: 404 })
  }

  const result = await readDocument(doc.storagePath)
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: 'Document kon niet worden opgehaald.' }, { status: 404 })
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'Content-Disposition': `inline; filename="${doc.fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=0, no-store',
    },
  })
}
