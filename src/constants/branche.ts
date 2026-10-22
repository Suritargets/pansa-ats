/**
 * branche.ts
 * WAT:    Korte Nederlandse labels voor `job_branche` — voor publieke pagina's en de voorpagina.
 *         (De admin gebruikt de langere varianten in CandidateFilters/JobCategoryForm.)
 */

import type { JobBranche } from '../../drizzle/schema'

export const BRANCHE_SHORT_LABELS: Record<JobBranche, string> = {
  mining_operations: 'Mijnbouw',
  technical_maintenance: 'Technisch',
  trades: 'Vakwerk',
  hospitality_camp: 'Catering',
  administration_support: 'Administratie',
  security_safety: 'Veiligheid',
  logistics_warehouse: 'Logistiek',
}
