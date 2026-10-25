/**
 * api/client/documents/[id]/route.ts
 * WAT:    Streamt een document uit de private Vercel Blob store voor de client-portal.
 * WAAROM: Client-scoped variant van /api/documents/[id] — gebruikt `getDocumentByIdScoped`
 *         zodat een client alleen documenten kan zien van applications die met zijn eigen
 *         `clientId` gedeeld zijn (nooit een applicationId/documentId uit de request vertrouwen).
 *         Alleen niet-gevoelige documentsoorten (CV, certificaat) worden getoond — ID-scans en
 *         bewijs van goed gedrag blijven intern, ook al is de sollicitatie gedeeld.
 */

import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { readDocument } from '@/lib/blob'
import { getDocumentByIdScoped } from '@/services/queries'
import { CLIENT_VISIBLE_DOCUMENT_KINDS } from '@/lib/document-visibility'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['client'], '/client')
  if (!session.clientId) return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 403 })

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
