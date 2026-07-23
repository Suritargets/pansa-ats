/**
 * fuzzy-match.ts
 * WAT:    Matcht een AI-OCR-geraden naam (bedrijf/functie) tegen een bekende lijst —
 *         gedeeld door de losse en de bulk digitaliseer-flow.
 */

export function fuzzyMatchId(list: { id: string; name: string }[], guess?: string): string {
  if (!guess) return ''
  const normalized = guess.trim().toLowerCase()
  if (!normalized) return ''
  const exact = list.find((item) => item.name.toLowerCase() === normalized)
  if (exact) return exact.id
  const partial = list.find(
    (item) => item.name.toLowerCase().includes(normalized) || normalized.includes(item.name.toLowerCase())
  )
  return partial?.id ?? ''
}
