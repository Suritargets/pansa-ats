import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createInterviewQuestion } from '@/services/interview-questions'
import type { InterviewType } from '@/types/database'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<InterviewType, string> = {
  general: 'Algemeen gesprek (gescoord)',
  work_experience: 'Werkervaring-gesprek',
  client: 'Klantgesprek',
  medical: 'Medische keuring',
  second_terms: 'Tweede gesprek — arbeidsvoorwaarden',
}

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function InterviewQuestionForm() {
  return (
    <form action={createInterviewQuestion} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="type">Type interview</Label>
        <select id="type" name="type" defaultValue="general" className={cn(selectClasses)}>
          {(Object.entries(TYPE_LABELS) as [InterviewType, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">Categorie (optioneel)</Label>
        <Input id="category" name="category" placeholder="bv. Technische vakkennis" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="text">Vraag</Label>
        <Input id="text" name="text" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stepOrder">Volgorde</Label>
        <Input id="stepOrder" name="stepOrder" type="number" defaultValue={0} />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="scored" defaultChecked className="size-4" />
        Gescoord (1-5, zoals het algemene gesprek)
      </label>
      <Button type="submit">Toevoegen</Button>
    </form>
  )
}
