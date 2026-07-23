import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getCandidateById } from '@/services/queries'
import { updateOwnContactInfo } from '@/services/candidate-portal'
import { CandidateShell } from '@/components/candidate/CandidateShell'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const session = await requireSession(['candidate'], '/candidate')
  if (!session.candidateId) redirect('/candidate')

  const { saved } = await searchParams
  const candidate = await getCandidateById(session.candidateId)
  if (!candidate) redirect('/candidate')

  return (
    <CandidateShell session={session}>
      <h1 className="mb-6 text-lg font-semibold text-foreground">Mijn profiel</h1>

      <form action={updateOwnContactInfo} className="max-w-md space-y-4">
        {saved === '1' && (
          <Alert>
            <AlertDescription>Opgeslagen.</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label>Naam</Label>
          <p className="text-sm text-foreground">
            {candidate.firstName} {candidate.lastName}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={candidate.email ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefoon</Label>
          <Input id="phone" name="phone" defaultValue={candidate.phone ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Adres</Label>
          <Textarea id="address" name="address" defaultValue={candidate.address ?? ''} />
        </div>
        <Button type="submit">Opslaan</Button>
      </form>
    </CandidateShell>
  )
}
