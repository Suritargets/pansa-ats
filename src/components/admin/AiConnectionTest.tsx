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
        {isPending ? 'Bezig met testen…' : 'Verbinding testen'}
      </Button>
      {result?.ok && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Verbinding werkt: {result.model} antwoordde in {result.ms} ms.
        </p>
      )}
      {result && !result.ok && <p className="text-sm text-destructive">Verbinding mislukt: {result.error}</p>}
    </div>
  )
}
