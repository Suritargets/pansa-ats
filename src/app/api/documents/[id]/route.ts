/**
 * api/documents/[id]/route.ts
 * WAT:    Streamt een document (CV, scan, ID, certificaat) uit de private Vercel Blob store.
 * WAAROM: De store staat op `access: 'private'` — dit is de enige plek waar een document
 *         gelezen kan worden, en alleen voor ingelogde staff.
 */

import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { readDocument } from '@/lib/blob'
import { getDocumentById } from '@/services/queries'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession(['super_admin', 'hr_staff', 'recruiter'])

  const { id } = await params
  const doc = await getDocumentById(id)
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
