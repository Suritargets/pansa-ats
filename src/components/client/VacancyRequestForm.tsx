import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createVacancyRequest } from '@/services/client-portal'
import type { JobCategory } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function VacancyRequestForm({ jobCategories, saved }: { jobCategories: JobCategory[]; saved?: boolean }) {
  return (
    <form action={createVacancyRequest} className="max-w-lg space-y-4">
      {saved && (
        <Alert>
          <AlertDescription>Aanvraag verstuurd.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="jobCategoryId">Functie</Label>
        <select id="jobCategoryId" name="jobCategoryId" className={cn(selectClasses)} defaultValue="">
          <option value="">Kies een functie...</option>
          {jobCategories.map((jc) => (
            <option key={jc.id} value={jc.id}>
              {jc.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quantity">Aantal medewerkers</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Toelichting</Label>
        <Textarea id="notes" name="notes" placeholder="Job scope, projectlocatie, gewenste startdatum..." />
      </div>
      <Button type="submit">Aanvraag versturen</Button>
    </form>
  )
}
