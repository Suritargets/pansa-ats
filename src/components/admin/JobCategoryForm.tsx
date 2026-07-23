import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createJobCategory } from '@/services/job-categories'
import type { JobBranche, JobLevel } from '@/types/database'
import { cn } from '@/lib/utils'

const BRANCHE_LABELS: Record<JobBranche, string> = {
  mining_operations: 'Mijnbouw operaties',
  technical_maintenance: 'Technisch onderhoud',
  trades: 'Vakmanschap',
  hospitality_camp: 'Camp/hospitality',
  administration_support: 'Administratie',
  security_safety: 'Beveiliging/veiligheid',
  logistics_warehouse: 'Logistiek/magazijn',
}

const LEVEL_LABELS: Record<JobLevel, string> = {
  helper: 'Helper',
  operator: 'Operator',
  skilled: 'Vakbekwaam',
  supervisor: 'Supervisor',
  administrative: 'Administratief',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function JobCategoryForm() {
  return (
    <form action={createJobCategory} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Functienaam</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="branche">Branche</Label>
          <select id="branche" name="branche" defaultValue="mining_operations" className={cn(selectClasses)}>
            {(Object.entries(BRANCHE_LABELS) as [JobBranche, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">Niveau</Label>
          <select id="level" name="level" defaultValue="operator" className={cn(selectClasses)}>
            {(Object.entries(LEVEL_LABELS) as [JobLevel, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="active" defaultChecked className="size-4" />
        Actief
      </label>
      <Button type="submit">Toevoegen</Button>
    </form>
  )
}
