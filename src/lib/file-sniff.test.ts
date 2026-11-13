import { describe, expect, it } from 'vitest'
import { sanitizeFileName, sniffFile, sniffFileType, SNIFF_BYTES } from './file-sniff'

describe('sniffFileType', () => {
  it('recognizes a PDF signature (%PDF-)', () => {
    expect(sniffFileType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]))).toBe('pdf')
  })

  it('recognizes a JPEG signature', () => {
    expect(sniffFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg')
  })

  it('recognizes a PNG signature', () => {
    expect(sniffFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png')
  })

  it('recognizes a WebP signature (RIFF ... WEBP)', () => {
    const bytes = new Uint8Array(16)
    bytes.set([0x52, 0x49, 0x46, 0x46], 0) // RIFF
    bytes.set([0x00, 0x00, 0x00, 0x00], 4) // chunk size, irrelevant
    bytes.set([0x57, 0x45, 0x42, 0x50], 8) // WEBP
    expect(sniffFileType(bytes)).toBe('webp')
  })

  // The whole point of sniffing is that a disguised file (e.g. a script renamed to
  // "resume.pdf", or a browser-supplied application/pdf content-type on other bytes)
  // must not be accepted just because it claims to be one of the allowed types.
  it('rejects content that does not match a known signature, regardless of claimed type', () => {
    expect(sniffFileType(new TextEncoder().encode('<?php system($_GET["c"]); ?>'))).toBeNull()
  })

  it('rejects an empty buffer', () => {
    expect(sniffFileType(new Uint8Array(0))).toBeNull()
  })

  it('rejects a near-miss signature (RIFF without WEBP)', () => {
    const bytes = new Uint8Array(16)
    bytes.set([0x52, 0x49, 0x46, 0x46], 0)
    expect(sniffFileType(bytes)).toBeNull()
  })
})

describe('sniffFile', () => {
  it('sniffs a File built from a Blob with a spoofed MIME type', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, ...new Array(8).fill(0)])
    const file = new File([pdfBytes], 'evil.exe', { type: 'application/x-msdownload' })
    expect(await sniffFile(file)).toBe('pdf')
  })

  it('only reads the first SNIFF_BYTES bytes', async () => {
    const bytes = new Uint8Array(SNIFF_BYTES + 100)
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
    const file = new File([bytes], 'big.png')
    expect(await sniffFile(file)).toBe('png')
  })
})

describe('sanitizeFileName', () => {
  it('strips directory components from a path', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd')
    expect(sanitizeFileName('C:\\Users\\jan\\secret.pdf')).toBe('secret.pdf')
  })

  it('removes control characters', () => {
    expect(sanitizeFileName('cv\u0000.pdf')).toBe('cv.pdf')
  })

  it('replaces characters outside letters, numbers, dot, space, dash and underscore', () => {
    expect(sanitizeFileName('cv<script>.pdf')).toBe('cv_script_.pdf')
  })

  it('collapses whitespace and trims leading dots/spaces', () => {
    expect(sanitizeFileName('  ..cv   final.pdf')).toBe('cv final.pdf')
  })

  it('falls back to "document" when nothing usable remains', () => {
    expect(sanitizeFileName('....')).toBe('document')
    expect(sanitizeFileName('/')).toBe('document')
  })

  it('truncates very long names while preserving a short extension', () => {
    const longName = 'a'.repeat(200) + '.pdf'
    const result = sanitizeFileName(longName)
    expect(result.length).toBe(120)
    expect(result.endsWith('.pdf')).toBe(true)
  })

  it('keeps an unusually long "extension" out of the preserved suffix', () => {
    const name = 'a'.repeat(200) + '.' + 'b'.repeat(20)
    const result = sanitizeFileName(name)
    expect(result.length).toBe(120)
    expect(result.endsWith('.' + 'b'.repeat(20))).toBe(false)
  })
})
