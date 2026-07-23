'use client'

/**
 * ChatWidget.tsx
 * WAT:    Zwevende chatbubbel + paneel voor de publieke chat-widget (/embed/chat).
 *         Handmatige fetch + stream-reader i.p.v. useChat — simpeler en stabieler voor
 *         een kale tekst-stream (geen tool calls, geen UI-message-protocol nodig).
 * WAAROM: Rapporteert zijn eigen breedte/hoogte aan het bovenliggende venster (bubble vs.
 *         paneel) zodat public/embed.js de iframe correct kan sizen.
 */

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const BUBBLE_SIZE = { width: 64, height: 64 }
const PANEL_SIZE = { width: 360, height: 540 }

function reportSize(open: boolean) {
  if (window.self === window.top) return
  const size = open ? PANEL_SIZE : BUBBLE_SIZE
  window.parent.postMessage({ type: 'pansa-ats-embed-resize', ...size }, '*')
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    reportSize(open)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      if (!response.body) throw new Error('Geen antwoord ontvangen.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages([...nextMessages, { role: 'assistant', content: assistantText }])
      }
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'Sorry, er ging iets mis. Probeer het later opnieuw.' }])
    } finally {
      setIsStreaming(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Chat openen"
      >
        <MessageCircle className="size-6" />
      </button>
    )
  }

  return (
    <div className="flex h-[540px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <span className="font-heading text-lg font-semibold">Pansa — chat</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Chat sluiten">
          <X className="size-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Hoi! Stel gerust een vraag over solliciteren of personeel aanvragen bij Pansa Group.
          </p>
        )}
        {messages.map((message, i) => (
          <div key={i} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              )}
            >
              {message.content || (isStreaming && i === messages.length - 1 ? '…' : '')}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Typ je vraag..."
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="button" size="icon" onClick={sendMessage} disabled={isStreaming || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
