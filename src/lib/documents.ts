/**
 * documents.ts
 * WAT:    Gedeelde labels en zichtbaarheidsregels voor sollicitatiedocumenten.
 * WAAROM: ID-bewijs, bewijs van goed gedrag en de handgeschreven scan bevatten gevoelige
 *         persoonsgegevens die intern blijven — alleen CV en diploma's/certificaten zijn
 *         relevant voor de plaatsingsbeslissing van een klant en mogen naar de client-portal.
 */

import type { DocumentKind } from '../../drizzle/schema'

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  cv: 'CV',
  handwritten_scan: 'Scan handgeschreven formulier',
  id_document: 'ID-document',
  certificate: 'Diploma/certificaat',
  police_clearance: 'Bewijs van goed gedrag',
  other: 'Overig',
}

export const CLIENT_VISIBLE_DOCUMENT_KINDS: DocumentKind[] = ['cv', 'certificate']
