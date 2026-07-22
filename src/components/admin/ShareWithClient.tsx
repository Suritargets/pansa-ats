'use client'

/**
 * ShareWithClient.tsx
 * WAT:    Deelt een sollicitatie met een klantbedrijf (client portal) of trekt dit weer in.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { shareApplicationWithClient, unshareApplicationFromClient } from '@/services/applications'
import type { ClientCandidateShareRow, Company } from '@/types/database'

export function ShareWithClient({
  applicationId,
  shares,
  shareableCompanies,
}: {
  applicationId: string
  shares: { share: ClientCandidateShareRow; company: Company }[]
  shareableCompanies: Company[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(shareableCompanies[0]?.id ?? '')

  function share() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await shareApplicationWithClient(applicationId, selected)
      if (!result.success) setError(result.error)
      else router.refresh()
    })
  }

  function unshare(clientCompanyId: string) {
    setError(null)
    startTransition(async () => {
      const result = await unshareApplicationFromClient(applicationId, clientCompanyId)
      if (!result.success) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {shares.length === 0 && <p className="text-sm text-muted-foreground">Nog niet gedeeld met een klant.</p>}
      <ul className="space-y-2">
        {shares.map(({ share, company }) => (
          <li key={share.id} className="rounded-lg border border-border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{company.name}</p>
                <p className="text-xs text-muted-foreground">Gedeeld op {formatDate(share.sharedAt)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => unshare(company.id)}
              >
                Intrekken
              </Button>
            </div>
            {share.clientFeedback && (
              <p className="mt-2 rounded-md bg-muted px-2 py-1.5 text-xs text-foreground">
                &ldquo;{share.clientFeedback}&rdquo;
              </p>
            )}
          </li>
        ))}
      </ul>

      {shareableCompanies.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {shareableCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={isPending || !selected} onClick={share}>
            Delen
          </Button>
        </div>
      )}
    </div>
  )
}
