import { describe, expect, it } from 'vitest'
import { sanitizeFileName, sniffFileType } from '../file-sniff'

describe('sniffFileType', () => {
  it('recognizes a PDF by its magic bytes', () => {
    const bytes = new TextEncoder().encode('%PDF-1.7\nrest-of-file')
    expect(sniffFileType(bytes)).toBe('pdf')
  })

  it('recognizes a JPEG by its magic bytes', () => {
    expect(sniffFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))).toBe('jpeg')
  })

  it('recognizes a PNG by its magic bytes', () => {
    expect(sniffFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toBe('png')
  })

  it('recognizes a WebP by its RIFF/WEBP markers', () => {
    const bytes = new Uint8Array(16)
    bytes.set([0x52, 0x49, 0x46, 0x46], 0) // RIFF
    bytes.set([0, 0, 0, 0], 4) // chunk size, irrelevant
    bytes.set([0x57, 0x45, 0x42, 0x50], 8) // WEBP
    expect(sniffFileType(bytes)).toBe('webp')
  })

  it('does not mistake a plain RIFF (e.g. WAV) for WebP', () => {
    const bytes = new Uint8Array(16)
    bytes.set([0x52, 0x49, 0x46, 0x46], 0) // RIFF
    bytes.set([0x57, 0x41, 0x56, 0x45], 8) // WAVE, not WEBP
    expect(sniffFileType(bytes)).toBeNull()
  })

  it('rejects content that spoofs a different extension', () => {
    // An .exe (MZ header) renamed to look like a PDF upload must not sniff as a known type.
    expect(sniffFileType(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull()
  })

  it('rejects an empty buffer', () => {
    expect(sniffFileType(new Uint8Array(0))).toBeNull()
  })
})

describe('sanitizeFileName', () => {
  it('strips directory components from the name', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd')
    expect(sanitizeFileName('C:\\Windows\\System32\\evil.exe')).toBe('evil.exe')
  })

  it('removes control characters', () => {
    expect(sanitizeFileName('cv\u0000.pdf')).toBe('cv.pdf')
  })

  it('replaces characters outside the allowed set with underscores', () => {
    expect(sanitizeFileName('cv#1*final.pdf')).toBe('cv_1_final.pdf')
  })

  it('collapses whitespace and trims leading dots/spaces', () => {
    expect(sanitizeFileName('  ..my   cv.pdf')).toBe('my cv.pdf')
  })

  it('falls back to a default name when nothing usable remains', () => {
    expect(sanitizeFileName('././.')).toBe('document')
    expect(sanitizeFileName('')).toBe('document')
  })

  it('keeps unicode letters such as diacritics', () => {
    expect(sanitizeFileName('Curriculum Vitae - José.pdf')).toBe('Curriculum Vitae - José.pdf')
  })

  it('truncates very long names while preserving a short extension', () => {
    const longName = `${'a'.repeat(200)}.pdf`
    const result = sanitizeFileName(longName)
    expect(result.length).toBe(120)
    expect(result.endsWith('.pdf')).toBe(true)
  })
})
