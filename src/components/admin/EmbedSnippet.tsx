'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmbedSnippet({ origin }: { origin: string }) {
  const [copied, setCopied] = useState(false)
  const snippet = `<div data-pansa-apply></div>\n<script src="${origin}/embed.js" async></script>`

  return (
    <div className="space-y-2">
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">
        <code>{snippet}</code>
      </pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(snippet)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Gekopieerd' : 'Kopiëren'}
      </Button>
    </div>
  )
}
