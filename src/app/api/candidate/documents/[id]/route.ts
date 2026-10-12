/**
 * api/candidate/documents/[id]/route.ts
 * WAT:    Streamt een document uit de private Vercel Blob store voor de candidate-portal.
 * WAAROM: Een kandidaat mag alleen zijn eigen geüploade documenten zien —
 *         `getDocumentByIdScoped` controleert dat server-side via `candidateId`,
 *         los van wat de UI toont.
 */

import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { readDocument } from '@/lib/blob'
import { getDocumentByIdScoped } from '@/services/queries'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const { id } = await params
  const doc = await getDocumentByIdScoped(id, { candidateId: session.candidateId })
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
