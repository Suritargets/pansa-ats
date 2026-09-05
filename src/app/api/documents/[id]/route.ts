/**
 * api/documents/[id]/route.ts
 * WAT:    Streamt een document (CV, scan, ID, certificaat) uit de private Vercel Blob store.
 * WAAROM: De store staat op `access: 'private'` — dit is de enige plek waar een document
 *         gelezen kan worden. Staff mag elk document zien; een client/candidate alleen een
 *         document dat hoort bij een sollicitatie die met hen gedeeld is, resp. hun eigen
 *         sollicitatie (zie `getDocumentByIdScoped`, nooit `getDocumentById` voor die rollen).
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { readDocument } from '@/lib/blob'
import { getDocumentById, getDocumentByIdScoped } from '@/services/queries'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 401 })

  const { id } = await params
  const isStaff = STAFF_ROLES.includes(session.role as (typeof STAFF_ROLES)[number])
  const doc = isStaff
    ? await getDocumentById(id)
    : await getDocumentByIdScoped(id, {
        clientId: session.clientId ?? undefined,
        candidateId: session.candidateId ?? undefined,
      })
  if (!doc) return NextResponse.json({ error: 'Document niet gevonden.' }, { status: 404 })

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
