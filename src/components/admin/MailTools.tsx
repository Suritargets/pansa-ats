'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { processQueueAction, sendTestMail, type TestMailState } from '@/services/mail-admin'

const INITIAL: TestMailState = { error: null }

export function MailTools({ defaultTo, disabled }: { defaultTo: string; disabled: boolean }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(sendTestMail, INITIAL)
  const [queueResult, setQueueResult] = useState<{ error: string | null; message?: string } | null>(null)
  const [queuePending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="to">Testmail versturen naar</Label>
          <Input id="to" name="to" type="email" required defaultValue={defaultTo} disabled={disabled} />
        </div>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={pending || disabled}>
          {pending ? 'Bezig...' : 'Testmail versturen'}
        </Button>
      </form>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Mails gaan direct na het aanmaken de deur uit. Wat mislukt is, wordt dagelijks opnieuw geprobeerd; hier verwerk je de
          wachtrij meteen.
        </p>
        {queueResult && (
          <Alert variant={queueResult.error ? 'destructive' : 'default'}>
            <AlertDescription>{queueResult.error ?? queueResult.message}</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={queuePending || disabled}
          onClick={() =>
            startTransition(async () => {
              setQueueResult(await processQueueAction())
              router.refresh()
            })
          }
        >
          {queuePending ? 'Bezig...' : 'Wachtrij nu verwerken'}
        </Button>
      </div>
    </div>
  )
}
