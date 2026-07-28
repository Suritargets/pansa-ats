'use client'

/**
 * EmergencyContacts.tsx
 * WAT:    Noodcontacten van de kandidaat (max 3, van "Basisgegevens nieuwe medewerker"),
 *         zichtbaar en bewerkbaar op de Profiel-tab.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addEmergencyContact, removeEmergencyContact } from '@/services/candidates'
import type { EmergencyContact } from '@/types/database'

const MAX_CONTACTS = 3

const emptyForm = { name: '', relationship: '', phone: '', address: '' }

export function EmergencyContacts({
  candidateId,
  applicationId,
  contacts,
}: {
  candidateId: string
  applicationId: string
  contacts: EmergencyContact[]
}) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()

  function add(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    startTransition(async () => {
      await addEmergencyContact(candidateId, applicationId, {
        name: form.name.trim(),
        relationship: form.relationship.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        priority: contacts.length + 1,
      })
      setForm(emptyForm)
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
    <div className="space-y-3">
      {contacts.length === 0 && <p className="text-sm text-muted-foreground">Nog geen noodcontacten toegevoegd.</p>}
      <ul className="space-y-2">
        {contacts.map((contact) => (
          <li key={contact.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-foreground">
                {contact.name}
                {contact.relationship ? <span className="ml-1.5 text-xs text-muted-foreground">({contact.relationship})</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {[contact.phone, contact.address].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <Button variant="ghost" disabled={isPending} onClick={() => remove(contact.id)}>
              Verwijderen
            </Button>
          </li>
        ))}
      </ul>

      {contacts.length < MAX_CONTACTS && (
        <form onSubmit={add} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ec-name">Naam</Label>
            <Input id="ec-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-relationship">Relatie</Label>
            <Input
              id="ec-relationship"
              value={form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-phone">Telefoon</Label>
            <Input id="ec-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-address">Adres</Label>
            <Input id="ec-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              Noodcontact toevoegen
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
