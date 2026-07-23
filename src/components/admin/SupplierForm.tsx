import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupplier, updateSupplier } from '@/services/crm'
import type { Supplier } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function SupplierForm({ supplier, saved }: { supplier?: Supplier; saved?: boolean }) {
  const action = supplier ? updateSupplier.bind(null, supplier.id) : createSupplier

  return (
    <form action={action} className="max-w-xl space-y-4">
      {saved && (
        <Alert>
          <AlertDescription>Opgeslagen.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Naam</Label>
        <Input id="name" name="name" defaultValue={supplier?.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kind">Type</Label>
        <select id="kind" name="kind" defaultValue={supplier?.kind ?? 'other'} className={cn(selectClasses)}>
          <option value="medical">Medisch</option>
          <option value="staffing">Uitzendbureau</option>
          <option value="insurance">Verzekering</option>
          <option value="training">Training</option>
          <option value="government">Overheid</option>
          <option value="other">Overig</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contactpersoon</Label>
          <Input id="contactName" name="contactName" defaultValue={supplier?.contactName ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">Telefoon</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={supplier?.contactPhone ?? ''} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">E-mail</Label>
        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={supplier?.contactEmail ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Adres</Label>
        <Textarea id="address" name="address" defaultValue={supplier?.address ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notities</Label>
        <Textarea id="notes" name="notes" defaultValue={supplier?.notes ?? ''} />
      </div>
      <Button type="submit">Opslaan</Button>
    </form>
  )
}
