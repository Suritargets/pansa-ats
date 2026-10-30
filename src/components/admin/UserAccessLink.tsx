'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CopyableLink } from '@/components/shared/CopyableLink'
import { createAccessLink } from '@/services/users'

/** Maakt een nieuwe eenmalige instel-link voor een account en toont die direct (72 uur geldig). */
export function UserAccessLink({ id, disabled }: { id: string; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error: string | null; link?: string } | null>(null)

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending || disabled}
        onClick={() =>
          startTransition(async () => {
            setResult(await createAccessLink(id))
          })
        }
      >
        Nieuwe link
      </Button>
      {result?.error && <p className="text-xs text-destructive">{result.error}</p>}
      {result?.link && (
        <div className="w-64">
          <CopyableLink link={result.link} />
          <p className="mt-1 text-xs text-muted-foreground">Eenmalig, 72 uur geldig.</p>
        </div>
      )}
    </div>
  )
}
