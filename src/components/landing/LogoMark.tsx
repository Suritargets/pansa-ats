/**
 * LogoMark.tsx
 * WAT:    Logo voor de publieke pagina's: het echte bestand uit /public/landing als dat er staat,
 *         anders een tandwiel-met-skyline benadering in de huisstijlkleuren.
 */

export function LogoMark({ src, size }: { src: string | null; size: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- statisch bestand uit /public, geen optimalisatie nodig
    return <img src={src} alt="" width={size} height={size} className="shrink-0 object-contain" />
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx="32" cy="32" r="22" fill="none" stroke="#fff" strokeWidth="6" strokeDasharray="7 5" />
      <circle cx="32" cy="32" r="16" fill="#fff" />
      <rect x="21" y="30" width="6" height="12" fill="#1c9848" />
      <rect x="29" y="24" width="6" height="18" fill="#1c9848" />
      <rect x="37" y="33" width="6" height="9" fill="#1c9848" />
    </svg>
  )
}
