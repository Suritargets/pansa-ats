'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CopyableLink } from '@/components/shared/CopyableLink'
import { createUser, type CreateUserState } from '@/services/users'
import type { Client, UserRole } from '@/types/database'
import { cn } from '@/lib/utils'

// Kandidaat-accounts ontstaan bij een sollicitatie, niet via dit formulier.
const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  super_admin: 'Super admin',
  hr_staff: 'HR-medewerker',
  recruiter: 'Recruiter',
  client: 'Client (portal)',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const INITIAL: CreateUserState = { error: null }

export function UserForm({ clients }: { clients: Client[] }) {
  const [state, formAction, pending] = useActionState(createUser, INITIAL)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Naam</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role">Rol</Label>
        <select id="role" name="role" defaultValue="hr_staff" className={cn(selectClasses)}>
          {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">Koppel aan client (verplicht bij rol &quot;Client&quot;)</Label>
        <select id="clientId" name="clientId" defaultValue="" className={cn(selectClasses)}>
          <option value="">Geen</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.link && (
        <Alert>
          <AlertDescription className="space-y-2">
            <p>
              Account aangemaakt voor {state.email}. Stuur deze link naar de gebruiker; die is 72 uur geldig, werkt één keer en
              wordt niet nogmaals getoond.
            </p>
            <CopyableLink link={state.link} />
          </AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Bezig...' : 'Account aanmaken'}
      </Button>
    </form>
  )
}
