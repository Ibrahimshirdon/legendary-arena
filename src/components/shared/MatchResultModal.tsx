import { Loader2, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { submitMatchResult } from '@/lib/matches'
import { usePlayer } from '@/store/playersStore'
import type { Match } from '@/types'

function ScoreStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus className="size-4" />
        </Button>
        <span className="w-10 text-center text-3xl font-black tabular-nums">{value}</span>
        <Button type="button" variant="outline" size="icon" onClick={() => onChange(value + 1)}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function MatchResultModal({
  match,
  open,
  onOpenChange,
}: {
  match: Match
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile } = useAuth()
  const player1 = usePlayer(match.player1Id)
  const player2 = usePlayer(match.player2Id)
  const [score1, setScore1] = useState(match.submission1?.score1 ?? 0)
  const [score2, setScore2] = useState(match.submission2?.score2 !== undefined ? match.submission2?.score2 : 0)
  const [submitting, setSubmitting] = useState(false)

  if (!profile) return null

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const outcome = await submitMatchResult(match.id, profile!.uid, score1, score2)
      if (outcome === 'completed') toast.success('Result confirmed by both players!')
      else if (outcome === 'disputed') toast.warning('Scores do not match — marked as disputed for admin review.')
      else toast.success('Result submitted. Waiting for your opponent to confirm.')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit result.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit match result</DialogTitle>
          <DialogDescription>
            Enter the final score exactly as played. Both players must agree for it to be confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:justify-between">
          <div className="flex flex-1 flex-col items-center gap-2">
            <PlayerAvatar src={player1?.avatarUrl} name={player1?.username ?? 'Player 1'} size="lg" />
            <span className="text-sm font-semibold">{player1?.username}</span>
            <ScoreStepper label="Score" value={score1} onChange={setScore1} />
          </div>
          <span className="text-xl font-black text-muted-foreground sm:pt-8">VS</span>
          <div className="flex flex-1 flex-col items-center gap-2">
            <PlayerAvatar src={player2?.avatarUrl} name={player2?.username ?? 'Player 2'} size="lg" />
            <span className="text-sm font-semibold">{player2?.username}</span>
            <ScoreStepper label="Score" value={score2} onChange={setScore2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
