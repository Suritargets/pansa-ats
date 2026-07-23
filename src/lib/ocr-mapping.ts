/**
 * ocr-mapping.ts
 * WAT:    Zet een OCR-extractieresultaat om naar (gedeeltelijke) ApplicationForm-waarden —
 *         gedeeld door de losse en de bulk digitaliseer-flow.
 */

import type { ApplicationFormValues } from '@/components/candidate/ApplicationForm'
import type { OcrExtractionResult } from '@/services/ocr'
import { fuzzyMatchId } from '@/lib/fuzzy-match'
import type { Company, JobCategory } from '@/types/database'

export function mapOcrResultToFormValues(
  result: OcrExtractionResult,
  companies: Company[],
  jobCategories: JobCategory[]
): Partial<ApplicationFormValues> {
  const { companyNameGuess, jobCategoryGuess, education, priorTrainings, workHistory, ...rest } = result

  return {
    ...rest,
    companyId: fuzzyMatchId(companies, companyNameGuess),
    jobCategoryId: fuzzyMatchId(jobCategories, jobCategoryGuess),
    education: (education ?? []).map((e) => ({
      level: e.level ?? '',
      fieldOfStudy: e.fieldOfStudy ?? '',
      completed: e.completed ?? false,
    })),
    priorTrainings: (priorTrainings ?? []).map((t) => ({
      kind: t.kind ?? '',
      title: t.title ?? '',
      period: t.period ?? '',
      completed: t.completed ?? false,
    })),
    workHistory: (workHistory ?? []).map((w) => ({
      period: w.period ?? '',
      company: w.company ?? '',
      role: w.role ?? '',
      salary: w.salary ?? '',
      reasonForLeaving: w.reasonForLeaving ?? '',
    })),
  }
}
