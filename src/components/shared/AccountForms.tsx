'use client'

/**
 * AccountForms.tsx
 * WAT:    Formulieren voor wachtwoord vergeten, wachtwoord instellen (uitnodiging/reset) en eigen wachtwoord wijzigen.
 * WAAROM: Eén bestand omdat de drie formulieren dezelfde velden en foutweergave delen.
 */

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { changeOwnPassword, completeTokenFlow, requestPasswordReset, type FormState } from '@/services/account'
import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

const INITIAL: FormState = { error: null }

function Feedback({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }
  if (state.success) {
    return (
      <Alert>
        <AlertDescription>{state.success}</AlertDescription>
      </Alert>
    )
  }
  return null
}

function NewPasswordFields() {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="password">Nieuw wachtwoord</Label>
        <Input id="password" name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">Minimaal {MIN_PASSWORD_LENGTH} tekens. Een zin of combinatie van woorden werkt het best.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Herhaal wachtwoord</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
      </div>
    </>
  )
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, INITIAL)
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Bezig...' : 'Link aanvragen'}
      </Button>
    </form>
  )
}

export function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(completeTokenFlow, INITIAL)
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <NewPasswordFields />
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Bezig...' : 'Wachtwoord instellen'}
      </Button>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPassword, INITIAL)
  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current">Huidig wachtwoord</Label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </div>
      <NewPasswordFields />
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Bezig...' : 'Wachtwoord wijzigen'}
      </Button>
    </form>
  )
}
