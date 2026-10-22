/**
 * WhatsAppActions.tsx
 * WAT:    Knoppen die een voorgevuld WhatsApp-bericht openen voor de zes contactmomenten uit het
 *         werving-/selectie-/introductieproces (PGC-HR-PR-0501-05, versie 30-09-2026).
 * WAAROM: Server component — het zijn gewone links (`wa.me`), er wordt niets vanuit de app
 *         verstuurd. HR past de [haakjes] aan in WhatsApp zelf.
 */

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  WHATSAPP_TEMPLATES,
  toWhatsAppNumber,
  whatsAppUrl,
  type WhatsAppContext,
} from '@/constants/whatsapp'

export function WhatsAppActions({ phone, context }: { phone: string | null; context: WhatsAppContext }) {
  const number = toWhatsAppNumber(phone)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <MessageCircle className="size-4" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {number ? (
          <>
            <p className="text-xs text-muted-foreground">
              Opent WhatsApp met een voorgevuld bericht naar +{number}. Vul de [haakjes] aan voor je verzendt.
            </p>
            <div className="flex flex-col gap-1.5">
              {WHATSAPP_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  nativeButton={false}
                  render={
                    <a
                      href={whatsAppUrl(number, template.build(context))}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <span className="truncate">{template.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                    {template.phase}
                  </span>
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {phone
              ? `Telefoonnummer "${phone}" kon niet naar een WhatsApp-nummer worden omgezet (verwacht 7 cijfers of een landcode).`
              : 'Geen telefoonnummer bekend.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
