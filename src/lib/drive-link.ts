/**
 * drive-link.ts
 * WAT:    Zet een Google Drive-deellink om naar een directe download-URL.
 * WAAROM: Geen Drive API/OAuth — dit werkt alleen voor bestanden die "voor iedereen met de
 *         link" gedeeld zijn, wat voor een batch gescande formulieren de realistische
 *         manier is waarop HR-staff ze deelt. Overige URL's gaan ongewijzigd door.
 */

const DRIVE_FILE_ID_PATTERNS = [/\/file\/d\/([^/]+)/, /[?&]id=([^&]+)/]

export function resolveDriveShareLink(url: string): string {
  if (!url.includes('drive.google.com')) return url

  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = pattern.exec(url)
    if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  }

  return url
}
