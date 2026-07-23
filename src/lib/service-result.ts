/**
 * service-result.ts
 * WAT:    Gedeeld resultaattype voor Server Actions — succes met data, of een foutmelding.
 */

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string }
