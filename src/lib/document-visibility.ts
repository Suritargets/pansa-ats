/**
 * document-visibility.ts
 * WAT:    Welke documentsoorten een externe client mag zien voor een gedeelde sollicitatie.
 * WAAROM: ID-scans, bewijs van goed gedrag e.d. zijn interne verificatiedocumenten — een client
 *         krijgt alleen het CV en diploma's/certificaten te zien, nooit de rest.
 */

import type { DocumentKind } from '@/types/database'

export const CLIENT_VISIBLE_DOCUMENT_KINDS: DocumentKind[] = ['cv', 'certificate']
