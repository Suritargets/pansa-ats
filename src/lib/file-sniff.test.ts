import { describe, expect, it } from 'vitest'
import { sanitizeFileName, sniffFile, sniffFileType, SNIFF_BYTES, SNIFFED_MIME } from './file-sniff'

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values)
}

describe('sniffFileType', () => {
  it('recognizes a PDF signature', () => {
    expect(sniffFileType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34))).toBe('pdf')
  })

  it('recognizes a JPEG signature', () => {
    expect(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg')
  })

  it('recognizes a PNG signature', () => {
    expect(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png')
  })

  it('recognizes a WebP signature (RIFF ... WEBP)', () => {
    // RIFF <4-byte size, irrelevant> WEBP
    expect(sniffFileType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe('webp')
  })

  it('rejects a RIFF file that is not WebP (e.g. a WAV file)', () => {
    expect(sniffFileType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45))).toBeNull()
  })

  it('rejects an executable disguised with a spoofed browser MIME type', () => {
    // MZ header (Windows PE/EXE) — the browser-reported `file.type` is irrelevant here,
    // this only looks at real content, which is the whole point of sniffing.
    expect(sniffFileType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull()
  })

  it('rejects an empty buffer', () => {
    expect(sniffFileType(bytes())).toBeNull()
  })

  it('every recognized type has a matching MIME type entry', () => {
    expect(Object.keys(SNIFFED_MIME).sort()).toEqual(['jpeg', 'pdf', 'png', 'webp'])
  })
})

describe('sniffFile', () => {
  it('only inspects the first SNIFF_BYTES bytes', async () => {
    const padding = new Uint8Array(SNIFF_BYTES + 100).fill(0x41)
    const pdfHeader = bytes(0x25, 0x50, 0x44, 0x46, 0x2d)
    const content = new Uint8Array(padding.length)
    content.set(pdfHeader, 0)
    content.set(padding.slice(pdfHeader.length), pdfHeader.length)

    const file = new File([content], 'fake.pdf', { type: 'application/pdf' })
    expect(await sniffFile(file)).toBe('pdf')
  })

  it('returns null for unrecognized content regardless of the declared type', async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'evil.pdf', { type: 'application/pdf' })
    expect(await sniffFile(file)).toBeNull()
  })
})

describe('sanitizeFileName', () => {
  it('strips directory components from the name', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd')
    expect(sanitizeFileName('C:\\Windows\\system32\\evil.exe')).toBe('evil.exe')
  })

  it('removes control characters', () => {
    expect(sanitizeFileName('cv\u0000.pdf')).toBe('cv.pdf')
  })

  it('replaces other unsafe characters with underscores', () => {
    expect(sanitizeFileName('cv (final)?.pdf')).toBe('cv _final__.pdf')
  })

  it('falls back to "document" when nothing safe remains', () => {
    expect(sanitizeFileName('////')).toBe('document')
    expect(sanitizeFileName('')).toBe('document')
  })

  it('keeps names at or under 120 characters untouched', () => {
    const name = 'a'.repeat(116) + '.pdf'
    expect(sanitizeFileName(name)).toBe(name)
  })

  it('truncates long names while preserving a short extension', () => {
    const name = 'a'.repeat(200) + '.pdf'
    const result = sanitizeFileName(name)
    expect(result.length).toBe(120)
    expect(result.endsWith('.pdf')).toBe(true)
  })
})
