'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { rateAiAnswer } from '@/services/ai-training'
import { SELECT_CLASS } from '@/components/admin/ChatKbForm'

interface Msg {
  role: 'user' | 'assistant'
  content: string
  logId?: string
  rating?: 1 | -1
}

type Assistant = 'public' | 'hr'

export function AiTestChat({ defaultAssistant = 'hr' }: { defaultAssistant?: Assistant }) {
  const [assistant, setAssistant] = useState<Assistant>(defaultAssistant)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fixIndex, setFixIndex] = useState<number | null>(null)
  const [fixText, setFixText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  function scroll() {
    endRef.current?.scrollIntoView({ block: 'end' })
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError(null)
    setInput('')
    const history: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setBusy(true)
    try {
      const res = await fetch('/api/admin/ai/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistant, messages: history.map((m) => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok || !res.body) throw new Error(res.status === 403 ? 'Geen toegang (alleen super admin).' : 'De assistent gaf geen antwoord.')
      const logId = res.headers.get('X-Log-Id') ?? undefined
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setMessages([...history, { role: 'assistant', content: answer, logId }])
        scroll()
      }
      if (!answer.trim()) throw new Error('De assistent gaf geen antwoord. Controleer of de AI-gateway is ingesteld en het gekozen model beschikbaar is.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis.')
      setMessages(history)
    } finally {
      setBusy(false)
      scroll()
    }
  }

  async function rate(index: number, rating: 1 | -1, note?: string) {
    const msg = messages[index]
    if (!msg?.logId) return
    await rateAiAnswer(msg.logId, rating, note)
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, rating } : m)))
    setFixIndex(null)
    setFixText('')
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="test-assistant" className="text-sm text-muted-foreground">
          Assistent
        </label>
        <select
          id="test-assistant"
          value={assistant}
          onChange={(e) => {
            setAssistant(e.target.value as Assistant)
            setMessages([])
          }}
          className={`${SELECT_CLASS} max-w-xs`}
        >
          <option value="hr">HR-assistent (medewerkers)</option>
          <option value="public">Website-chat (kandidaten & clienten)</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={busy || messages.length === 0}>
          Nieuw gesprek
        </Button>
      </div>

      <div className="max-h-[28rem] min-h-48 space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Stel een vraag zoals een medewerker of bezoeker dat zou doen. De assistent gebruikt de instructies, kennisbank en
            voorbeelden zoals ze nu zijn ingesteld.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className="max-w-[85%] space-y-1.5">
              <div
                className={
                  m.role === 'user'
                    ? 'whitespace-pre-wrap rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground'
                    : 'whitespace-pre-wrap rounded-2xl bg-muted px-3 py-2 text-sm text-foreground'
                }
              >
                {m.content || (busy && i === messages.length - 1 ? '…' : '')}
              </div>
              {m.role === 'assistant' && m.logId && m.content && !(busy && i === messages.length - 1) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Button variant={m.rating === 1 ? 'secondary' : 'ghost'} size="sm" onClick={() => rate(i, 1)}>
                      👍 Goed
                    </Button>
                    <Button
                      variant={m.rating === -1 ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setFixIndex(i)
                        setFixText('')
                      }}
                    >
                      👎 Fout
                    </Button>
                  </div>
                  {fixIndex === i && (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        value={fixText}
                        onChange={(e) => setFixText(e.target.value)}
                        placeholder="Wat had het antwoord moeten zijn? (optioneel — wordt bij Feedback bewaard en kan een voorbeeld worden)"
                      />
                      <Button size="sm" onClick={() => rate(i, -1, fixText)}>
                        Feedback opslaan
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Typ een vraag… (Enter verstuurt)"
          aria-label="Vraag aan de assistent"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Versturen
        </Button>
      </form>
    </div>
  )
}
