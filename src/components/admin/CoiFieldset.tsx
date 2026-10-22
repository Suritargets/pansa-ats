'use client'

/**
 * CoiFieldset.tsx
 * WAT:    Vier ja/nee-vragen + gebiedskeuze voor de Local Community of Interest (RGM) in een gewoon
 *         HTML-formulier (native `name`-velden `coi_<key>`), te lezen met `coiFromFormData`.
 * WAAROM: Het kandidaat-bewerkpaneel gebruikt een server action met FormData, geen react-hook-form
 *         zoals het sollicitatieformulier.
 */

import { useState } from 'react'
import { COI_AREAS, COI_QUESTIONS } from '@/constants/coi'
import type { CommunityOfInterest } from '@/types/database'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function CoiFieldset({ value }: { value: CommunityOfInterest | null }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(COI_QUESTIONS.map((q) => [q.yesKey, Boolean(value?.[q.yesKey])]))
  )

  return (
    <fieldset className="space-y-3 rounded-lg border border-border p-3">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Local Community of Interest (RGM)
      </legend>
      {COI_QUESTIONS.map((q) => (
        <div key={q.yesKey} className="space-y-1.5">
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name={`coi_${q.yesKey}`}
              checked={checked[q.yesKey]}
              onChange={(e) => setChecked((prev) => ({ ...prev, [q.yesKey]: e.target.checked }))}
              className="mt-0.5 size-4 rounded border-input"
            />
            {q.label}
          </label>
          {checked[q.yesKey] && (
            <select name={`coi_${q.areaKey}`} defaultValue={value?.[q.areaKey] ?? ''} className={selectClasses}>
              <option value="">Kies gebied...</option>
              {COI_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
              {q.yesKey === 'resident' && <option value="Other">Other</option>}
            </select>
          )}
        </div>
      ))}
    </fieldset>
  )
}
