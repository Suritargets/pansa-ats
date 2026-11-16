/**
 * EmbedFrame.tsx
 * WAT:    Wikkel voor de embed-formulieren (/embed/apply, /embed/vacancy-request).
 * WAAROM: In een iframe op een andere website bepaalt de host de marges en de breedte, dus daar blijft
 *         het formulier bijna zonder padding (anders staat het verder ingesprongen dan de tekst eromheen).
 *         Wie de URL zelf opent ziet anders een formulier over de volle schermbreedte; daar tonen we een
 *         gecentreerde kaart met padding. De browser meldt het verschil via de header Sec-Fetch-Dest
 *         ('iframe' tegenover 'document'); ontbreekt die, dan behandelen we het als ingesloten.
 */

import { headers } from 'next/headers'

export async function EmbedFrame({ children }: { children: React.ReactNode }) {
  const destination = (await headers()).get('sec-fetch-dest')

  if (destination === 'document') {
    return (
      <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">{children}</div>
      </main>
    )
  }

  return <main className="p-1">{children}</main>
}
