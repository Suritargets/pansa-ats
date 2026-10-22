/**
 * registration.ts
 * WAT:    Weergavenaam van het registratienummer van een kandidaat (registratieformulier,
 *         PGC-HR-F-0501-05, "REGISTRATIE NR").
 * WAAROM: Het papieren formulier draagt een nummer dat HR bij het digitaliseren overneemt
 *         (`registration_number`). Ontbreekt dat, dan valt de weergave terug op het automatische
 *         volgnummer (`registration_seq`) zodat elke kandidaat altijd een nummer heeft.
 */

export function registrationLabel(candidate: {
  registrationNumber: string | null
  registrationSeq: number
}): string {
  return candidate.registrationNumber?.trim() || `REG-${String(candidate.registrationSeq).padStart(5, '0')}`
}
