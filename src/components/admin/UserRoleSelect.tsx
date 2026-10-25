'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/services/users'
import type { UserRole } from '@/types/database'
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

// "Client" en "Kandidaat" hebben een verplichte koppeling (clientId/candidateId) die alleen
// het aanmaakformulier kan zetten — hiernaartoe wisselen kan dus alleen via een nieuw account.
const ASSIGNABLE_VIA_TABLE: UserRole[] = ['super_admin', 'hr_staff', 'recruiter']

export function UserRoleSelect({ id, role, disabled }: { id: string; role: UserRole; disabled?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const roleOptions = ASSIGNABLE_VIA_TABLE.includes(role) ? ASSIGNABLE_VIA_TABLE : [role, ...ASSIGNABLE_VIA_TABLE]

  return (
    <select
      defaultValue={role}
      disabled={isPending || disabled}
      className={cn(selectClasses, 'w-44')}
      onChange={(e) =>
        startTransition(async () => {
          await updateUserRole(id, e.target.value as UserRole)
          router.refresh()
        })
      }
    >
      {roleOptions.map((value) => (
        <option key={value} value={value}>
          {ROLE_LABELS[value]}
        </option>
      ))}
    </select>
  )
}
