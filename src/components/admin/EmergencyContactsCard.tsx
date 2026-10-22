'use client'

/**
 * EmergencyContactsCard.tsx
 * WAT:    Contactpersonen in geval van calamiteiten/ongevallen (tot 3) — onderdeel van het formulier
 *         "Basisgegevens nieuwe medewerker" (PGC-HR-F-0509-06) en van de dossier-index (onderdeel 7).
 * WAAROM: De server actions (`addEmergencyContact` / `removeEmergencyContact`) en de tabel bestonden
 *         al, maar er was nergens een scherm om ze te gebruiken.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addEmergencyContact, removeEmergencyContact } from '@/services/candidates'
import type { EmergencyContact } from '@/types/database'

const MAX_CONTACTS = 3

export function EmergencyContactsCard({
  candidateId,
  applicationId,
  contacts,
}: {
  candidateId: string
  applicationId: string
  contacts: EmergencyContact[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const text = (name: string) => String(data.get(name) ?? '').trim()
    if (!text('name')) return

    const used = new Set(contacts.map((c) => c.priority))
    const priority = [1, 2, 3].find((p) => !used.has(p)) ?? contacts.length + 1

    startTransition(async () => {
      await addEmergencyContact(candidateId, applicationId, {
        name: text('name'),
        relationship: text('relationship'),
        phone: text('phone'),
        address: text('address'),
        priority,
      })
      setFormKey((k) => k + 1)
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeEmergencyContact(id, applicationId)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Contactpersonen bij calamiteiten ({contacts.length}/{MAX_CONTACTS})</CardTitle>
        <p className="text-xs text-muted-foreground">Basisgegevens nieuwe medewerker (PGC-HR-F-0509-06)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.length === 0 && <p className="text-sm text-muted-foreground">Nog geen contactpersonen vastgelegd.</p>}
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">
                  {contact.priority}. {contact.name}
                  {contact.relationship ? ` — ${contact.relationship}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[contact.phone, contact.address].filter(Boolean).join(' · ') || 'Geen telefoon/adres'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => remove(contact.id)}
                title="Verwijderen"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>

        {contacts.length < MAX_CONTACTS && (
          <form key={formKey} onSubmit={add} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ec-name">Naam en voornaam</Label>
              <Input id="ec-name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-relationship">Relatie tot de werknemer</Label>
              <Input id="ec-relationship" name="relationship" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-phone">Telefoonnummer(s)</Label>
              <Input id="ec-phone" name="phone" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-address">Adres en woonplaats</Label>
              <Input id="ec-address" name="address" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" disabled={isPending}>
                Contactpersoon toevoegen
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
