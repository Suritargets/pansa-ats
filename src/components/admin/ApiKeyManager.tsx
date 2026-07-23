'use client'

/**
 * ApiKeyManager.tsx
 * WAT:    Aanmaken (met eenmalige weergave van de ruwe sleutel) + intrekken van API-sleutels.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createApiKey, revokeApiKey } from '@/services/api-keys'
import type { ApiKey, ApiKeyScope } from '@/types/database'
import { formatDate } from '@/lib/utils'

const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  'applications:read': 'Sollicitaties lezen',
  'applications:write': 'Sollicitaties aanmaken',
}

export function ApiKeyManager({ apiKeys }: { apiKeys: ApiKey[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<ApiKeyScope[]>(['applications:write'])
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleScope(scope: ApiKeyScope) {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const res = await createApiKey(name, scopes)
      if (res.success) {
        setRevealedKey(res.data.key)
        setName('')
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {revealedKey && (
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-medium text-foreground">
              Sleutel aangemaakt — kopieer nu, deze wordt niet nogmaals getoond:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">{revealedKey}</code>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="apiKeyName">Naam</Label>
          <Input id="apiKeyName" value={name} onChange={(e) => setName(e.target.value)} placeholder="bv. hpsnv-website" className="w-56" />
        </div>
        <div className="space-y-1.5">
          <Label>Scopes</Label>
          <div className="flex gap-3 pt-1">
            {(Object.entries(SCOPE_LABELS) as [ApiKeyScope, string][]).map(([scope, label]) => (
              <label key={scope} className="flex items-center gap-1.5 text-sm text-foreground">
                <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} className="size-4" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <Button onClick={handleCreate} disabled={isPending || !name.trim() || scopes.length === 0}>
          Sleutel aanmaken
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Sleutel</TableHead>
              <TableHead>Scopes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Laatst gebruikt</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  Nog geen API-sleutels.
                </TableCell>
              </TableRow>
            )}
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium text-foreground">{key.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{key.keyPrefix}…</TableCell>
                <TableCell className="text-xs text-muted-foreground">{(key.scopes as ApiKeyScope[]).map((s) => SCOPE_LABELS[s]).join(', ')}</TableCell>
                <TableCell>
                  <Badge variant={key.active ? 'default' : 'secondary'}>{key.active ? 'Actief' : 'Ingetrokken'}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Nooit'}</TableCell>
                <TableCell>
                  {key.active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        startTransition(async () => {
                          await revokeApiKey(key.id)
                          router.refresh()
                        })
                      }
                    >
                      Intrekken
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
