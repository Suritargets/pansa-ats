import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createTraining } from '@/services/trainings'

export function TrainingForm() {
  return (
    <form action={createTraining} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="standard">Standaard</Label>
          <Input id="standard" name="standard" placeholder="bv. ASME, AWS, API" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationHours">Duur (uren)</Label>
          <Input id="durationHours" name="durationHours" type="number" step="0.5" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Omschrijving</Label>
        <Textarea id="description" name="description" />
      </div>
      <Button type="submit">Training toevoegen</Button>
    </form>
  )
}
