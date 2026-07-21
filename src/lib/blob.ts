/**
 * blob.ts
 * WAT:    Upload van sollicitatiedocumenten (CV, scans, certificaten) naar Vercel Blob.
 * WAAROM: Vervangt Supabase Storage. Documenten bevatten persoonsgegevens, dus we uploaden
 *         met `access: 'public'` maar een niet-raadbaar pad (uuid + originele bestandsnaam) —
 *         downloaden gaat altijd via een ingelogde admin-actie, nooit via een publiek overzicht.
 */

import { put } from '@vercel/blob'

export async function uploadDocument(
  applicationId: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const path = `application-documents/${applicationId}/${crypto.randomUUID()}-${file.name}`
  const blob = await put(path, file, { access: 'public', addRandomSuffix: false })
  return { url: blob.url, fileName: file.name }
}
