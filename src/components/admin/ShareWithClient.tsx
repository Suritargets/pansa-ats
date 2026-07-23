'use client'

/**
 * ShareWithClient.tsx
 * WAT:    Deel deze sollicitatie met een klantbedrijf (of ontdeel), zichtbaar op de Profiel-tab.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { shareApplicationWithClient, unshareApplication } from '@/services/client-portal'
import type { Client, ClientCandidateShareRow } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function ShareWithClient({
  applicationId,
  shareableClients,
  shares,
}: {
  applicationId: string
  shareableClients: Client[]
  shares: (ClientCandidateShareRow & { client: Client })[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()

  function share() {
    if (!selected) return
    startTransition(async () => {
      await shareApplicationWithClient(applicationId, selected)
      setSelected('')
      router.refresh()
    })
  }

  function unshare(shareId: string) {
    startTransition(async () => {
      await unshareApplication(shareId, applicationId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {shares.length === 0 && <p className="text-sm text-muted-foreground">Nog niet gedeeld met een klant.</p>}
      <ul className="space-y-2">
        {shares.map((share) => (
          <li key={share.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>{share.client.name}</span>
            <Button variant="ghost" disabled={isPending} onClick={() => unshare(share.id)}>
              Ontdelen
            </Button>
          </li>
        ))}
      </ul>
      {shareableClients.length > 0 && (
        <div className="flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cn(selectClasses)}>
            <option value="">Kies een client...</option>
            {shareableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <Button disabled={!selected || isPending} onClick={share}>
            Delen
          </Button>
        </div>
      )}
    </div>
  )
}
