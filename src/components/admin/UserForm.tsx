import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createUser } from '@/services/users'
import type { Client, UserRole } from '@/types/database'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super admin',
  hr_staff: 'HR-medewerker',
  recruiter: 'Recruiter',
  client: 'Client (portal)',
  candidate: 'Kandidaat (portal)',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function UserForm({ clients }: { clients: Client[] }) {
  return (
    <form action={createUser} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Naam</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
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
        <Label htmlFor="clientId">Koppel aan client (alleen bij rol &quot;Client&quot;)</Label>
        <select id="clientId" name="clientId" defaultValue="" className={cn(selectClasses)}>
          <option value="">Geen</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">Account aanmaken</Button>
    </form>
  )
}
