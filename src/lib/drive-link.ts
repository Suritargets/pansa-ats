/**
 * drive-link.ts
 * WAT:    Zet een Google Drive-deellink om naar een directe download-URL, en valideert dat
 *         een URL (incl. eventuele redirect-hops) binnen een vaste hostname-allowlist blijft.
 * WAAROM: Geen Drive API/OAuth — dit werkt alleen voor bestanden die "voor iedereen met de
 *         link" gedeeld zijn. De allowlist voorkomt SSRF: zonder deze check zou de server
 *         een door de gebruiker opgegeven URL blind ophalen (incl. interne/private adressen).
 *         Alleen Google Drive-hosts zijn toegestaan — dat is het enige gedocumenteerde
 *         gebruik van deze functie.
 */

const DRIVE_FILE_ID_PATTERNS = [/\/file\/d\/([^/]+)/, /[?&]id=([^&]+)/]

const ALLOWED_HOSTS = [/^drive\.google\.com$/, /^docs\.google\.com$/, /(^|\.)googleusercontent\.com$/]

export function resolveDriveShareLink(url: string): string {
  if (!url.includes('drive.google.com')) return url

  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = pattern.exec(url)
    if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  }

  return url
}

export function isAllowedDriveHost(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  return ALLOWED_HOSTS.some((pattern) => pattern.test(parsed.hostname))
}
