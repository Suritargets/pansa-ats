import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createChatKbEntry } from '@/services/chat-kb'

export const SELECT_CLASS =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function ChatKbForm({ defaultAudience = 'public' }: { defaultAudience?: 'public' | 'hr' | 'both' }) {
  return (
    <form action={createChatKbEntry} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="topic">Onderwerp</Label>
        <Input id="topic" name="topic" required placeholder="bv. Sollicitatieprocedure" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audience">Voor welke assistent</Label>
        <select id="audience" name="audience" defaultValue={defaultAudience} className={SELECT_CLASS}>
          <option value="public">Website-chat (kandidaten & clienten)</option>
          <option value="hr">HR-assistent (medewerkers)</option>
          <option value="both">Beide</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="content">Inhoud</Label>
        <Textarea id="content" name="content" required rows={5} placeholder="De informatie die de chatbot mag gebruiken om deze vraag te beantwoorden..." />
      </div>
      <Button type="submit">Toevoegen</Button>
    </form>
  )
}
