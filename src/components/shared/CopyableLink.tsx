'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/** Toont een link in een alleen-lezen veld met een kopieerknop; selecteert alles bij focus. */
export function CopyableLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Klembord geblokkeerd: de gebruiker kan het geselecteerde veld zelf kopiëren.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={link} aria-label="Link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={copied ? 'Gekopieerd' : 'Link kopiëren'}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </div>
  )
}
