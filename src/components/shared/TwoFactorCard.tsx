'use client'

/**
 * TwoFactorCard.tsx
 * WAT:    Tweestapsverificatie instellen of uitzetten op "Mijn account": QR scannen, eerste code bevestigen,
 *         herstelcodes één keer tonen.
 */

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { beginTotpSetup, confirmTotpSetup, disableTotp, regenerateRecoveryCodes } from '@/services/two-factor'

type Stage = 'idle' | 'setup' | 'codes' | 'disable'

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const [stage, setStage] = useState<Stage>('idle')
  const [setup, setSetup] = useState<{ secret: string; qrSvg: string } | null>(null)
  const [codes, setCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [isEnabled, setIsEnabled] = useState(enabled)

  function begin() {
    setError(null)
    startTransition(async () => {
      const r = await beginTotpSetup()
      if (!r.ok) return setError(r.error)
      setSetup({ secret: r.secret, qrSvg: r.qrSvg })
      setStage('setup')
    })
  }

  function confirm(form: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await confirmTotpSetup(String(form.get('code') ?? ''))
      if (!r.ok) return setError(r.error)
      setCodes(r.recoveryCodes)
      setIsEnabled(true)
      setStage('codes')
    })
  }

  function regenerate(form: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await regenerateRecoveryCodes(String(form.get('code') ?? ''))
      if (!r.ok) return setError(r.error)
      setCodes(r.recoveryCodes)
      setStage('codes')
    })
  }

  function disable(form: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await disableTotp(String(form.get('password') ?? ''), String(form.get('code') ?? ''))
      if (!r.ok) return setError(r.error)
      setIsEnabled(false)
      setStage('idle')
    })
  }

  return (
    <section className="max-w-md space-y-3 rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground">Tweestapsverificatie</h2>
      <p className="text-sm text-muted-foreground">
        {isEnabled
          ? 'Aan: bij het inloggen vragen we naast je wachtwoord om een code uit je authenticator-app.'
          : 'Uit. Zet dit aan voor extra veiligheid: bij het inloggen is dan ook een code uit je authenticator-app nodig.'}
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stage === 'idle' && !isEnabled && (
        <Button onClick={begin} disabled={pending}>
          {pending ? 'Bezig...' : 'Aanzetten'}
        </Button>
      )}

      {stage === 'setup' && setup && (
        <form action={confirm} className="space-y-3">
          <p className="text-sm">Scan de QR-code met een authenticator-app (Google Authenticator, Microsoft Authenticator, 1Password...).</p>
          <div className="w-44 rounded-lg bg-white p-1" dangerouslySetInnerHTML={{ __html: setup.qrSvg }} />
          <p className="text-xs text-muted-foreground">
            Lukt scannen niet? Voer deze sleutel handmatig in: <span className="font-mono break-all text-foreground">{setup.secret}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="code">Eerste code uit de app</Label>
            <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="123456" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Bezig...' : 'Bevestigen'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStage('idle')}>
              Annuleren
            </Button>
          </div>
        </form>
      )}

      {stage === 'codes' && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Bewaar deze herstelcodes op een veilige plek. Elke code werkt één keer en je ziet ze hierna niet meer.</p>
          <ul className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-3 font-mono text-sm">
            {codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Button onClick={() => setStage('idle')}>Ik heb ze bewaard</Button>
        </div>
      )}

      {stage === 'idle' && isEnabled && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setStage('disable')}>
            Uitzetten
          </Button>
          <details className="w-full">
            <summary className="cursor-pointer text-sm text-muted-foreground">Nieuwe herstelcodes maken</summary>
            <form action={regenerate} className="mt-2 flex items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="regen-code">Code uit de app</Label>
                <Input id="regen-code" name="code" inputMode="numeric" required placeholder="123456" />
              </div>
              <Button type="submit" variant="outline" disabled={pending}>
                Maken
              </Button>
            </form>
          </details>
        </div>
      )}

      {stage === 'disable' && (
        <form action={disable} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dis-password">Wachtwoord</Label>
            <Input id="dis-password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dis-code">Code uit de app</Label>
            <Input id="dis-code" name="code" inputMode="numeric" required placeholder="123456" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Bezig...' : 'Uitzetten'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStage('idle')}>
              Annuleren
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
