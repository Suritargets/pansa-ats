/**
 * file-sniff.ts
 * WAT:    Bepaalt het echte bestandstype uit de eerste bytes en schoont bestandsnamen op.
 * WAAROM: `file.type` komt van de browser en is dus door de uploader te vervalsen; een .exe met type
 *         application/pdf zou anders gewoon worden opgeslagen. We vertrouwen alleen de inhoud.
 */

export type SniffedType = 'pdf' | 'jpeg' | 'png' | 'webp'

export const SNIFFED_MIME: Record<SniffedType, string> = {
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/** Aantal bytes dat `sniffFileType` nodig heeft. */
export const SNIFF_BYTES = 16

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, i) => bytes[offset + i] === value)
}

export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf' // %PDF-
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  // WebP: "RIFF" .... "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp'
  return null
}

/** Leest de eerste bytes van een File en bepaalt het echte type. */
export async function sniffFile(file: File): Promise<SniffedType | null> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer())
  return sniffFileType(head)
}

/**
 * Maakt een bestandsnaam veilig voor opslagpad en weergave: geen paden, geen stuurtekens,
 * geen rare scheidingstekens, maximaal 120 tekens met behoud van de extensie.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[. ]+/, '')
    .trim()
  if (!cleaned) return 'document'
  if (cleaned.length <= 120) return cleaned
  const dot = cleaned.lastIndexOf('.')
  const ext = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : ''
  return cleaned.slice(0, 120 - ext.length) + ext
}
