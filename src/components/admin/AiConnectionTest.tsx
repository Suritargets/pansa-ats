'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { testAiConnection, type ConnectionTestResult } from '@/services/ai-training'

export function AiConnectionTest() {
  const [result, setResult] = useState<ConnectionTestResult | null>(null)
  const [isPending, startTransition] = useTransition()
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(await testAiConnection())
          })
        }
      >
        {isPending ? 'Bezig met testen…' : 'Ingestelde modellen testen'}
      </Button>
      {result?.ok && (
        <ul className="space-y-1 text-sm">
          {result.results.map((r) => (
            <li key={r.model} className={r.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>
              {r.ok ? '✓' : '✕'} {r.model} ({r.used}){r.ok ? `: antwoordde in ${r.ms} ms` : `: ${r.error}`}
            </li>
          ))}
        </ul>
      )}
      {result && !result.ok && <p className="text-sm text-destructive">Verbinding mislukt: {result.error}</p>}
    </div>
  )
}
