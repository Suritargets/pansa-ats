/**
 * blob.ts
 * WAT:    Upload en download van sollicitatiedocumenten (CV, scans, certificaten) via Vercel Blob.
 * WAAROM: Vervangt Supabase Storage. Documenten bevatten persoonsgegevens (ID, scans), dus de
 *         store staat op `access: 'private'` — downloaden kan alleen server-side (met het
 *         BLOB_READ_WRITE_TOKEN) via `/api/documents/[id]`, nooit via een kale publieke URL.
 */

import { get, put } from '@vercel/blob'

export async function uploadDocument(
  applicationId: string,
  file: File
): Promise<{ pathname: string; fileName: string }> {
  const pathname = `application-documents/${applicationId}/${crypto.randomUUID()}-${file.name}`
  const blob = await put(pathname, file, { access: 'private', addRandomSuffix: false })
  return { pathname: blob.pathname, fileName: file.name }
}

export async function readDocument(pathname: string) {
  return get(pathname, { access: 'private' })
}
