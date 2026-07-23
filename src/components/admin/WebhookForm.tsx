import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createWebhookEndpoint } from '@/services/webhooks'
import type { WebhookEvent } from '@/types/database'

const EVENT_LABELS: Record<WebhookEvent, string> = {
  'application.created': 'Sollicitatie aangemaakt',
  'application.status_changed': 'Status gewijzigd',
}

export function WebhookForm() {
  return (
    <form action={createWebhookEndpoint} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Naam</Label>
        <Input id="name" name="name" required placeholder="bv. hpsnv-website CRM" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" required placeholder="https://..." />
      </div>
      <div className="space-y-1.5">
        <Label>Events</Label>
        {(Object.entries(EVENT_LABELS) as [WebhookEvent, string][]).map(([event, label]) => (
          <label key={event} className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="events" value={event} className="size-4" />
            {label}
          </label>
        ))}
      </div>
      <Button type="submit">Webhook toevoegen</Button>
    </form>
  )
}
