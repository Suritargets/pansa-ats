'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loginAction } from '@/services/auth-actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: null })

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Bezig...' : 'Inloggen'}
      </Button>
    </form>
  )
}
