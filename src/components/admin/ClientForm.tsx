import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient, updateClient } from '@/services/crm'
import type { Client } from '@/types/database'
import { cn } from '@/lib/utils'

const selectClasses =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function ClientForm({ client, saved }: { client?: Client; saved?: boolean }) {
  const action = client ? updateClient.bind(null, client.id) : createClient

  return (
    <form action={action} className="max-w-xl space-y-4">
      {saved && (
        <Alert>
          <AlertDescription>Opgeslagen.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Naam</Label>
        <Input id="name" name="name" defaultValue={client?.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="industry">Sector</Label>
          <Input id="industry" name="industry" defaultValue={client?.industry ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={client?.status ?? 'active'} className={cn(selectClasses)}>
            <option value="prospect">Prospect</option>
            <option value="active">Actief</option>
            <option value="inactive">Inactief</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contactpersoon</Label>
          <Input id="contactName" name="contactName" defaultValue={client?.contactName ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">Telefoon</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={client?.contactPhone ?? ''} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">E-mail</Label>
        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={client?.contactEmail ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Adres</Label>
        <Textarea id="address" name="address" defaultValue={client?.address ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notities</Label>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ''} />
      </div>
      <Button type="submit">Opslaan</Button>
    </form>
  )
}
