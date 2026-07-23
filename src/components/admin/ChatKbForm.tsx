import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createChatKbEntry } from '@/services/chat-kb'

export function ChatKbForm() {
  return (
    <form action={createChatKbEntry} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="topic">Onderwerp</Label>
        <Input id="topic" name="topic" required placeholder="bv. Sollicitatieprocedure" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="content">Inhoud</Label>
        <Textarea id="content" name="content" required rows={5} placeholder="De informatie die de chatbot mag gebruiken om deze vraag te beantwoorden..." />
      </div>
      <Button type="submit">Toevoegen</Button>
    </form>
  )
}
