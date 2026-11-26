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

function ScoreStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="w-8 text-center text-2xl font-black tabular-nums">{value}</span>
      <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => onChange(value + 1)}>
        <Plus className="size-3.5" />
      </Button>
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

        {/* Identity row: kept compact (no stepper here) so it never needs to wrap or stack. */}
        <div className="flex items-center justify-between gap-2 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PlayerAvatar src={player1?.avatarUrl} name={player1?.username ?? 'Player 1'} size="sm" />
            <span className="truncate text-sm font-semibold">{player1?.username}</span>
          </div>
          <span className="shrink-0 text-xs font-black text-muted-foreground">VS</span>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span className="truncate text-sm font-semibold">{player2?.username}</span>
            <PlayerAvatar src={player2?.avatarUrl} name={player2?.username ?? 'Player 2'} size="sm" />
          </div>
        </div>

        {/* Score row: both steppers side by side, small enough to always fit without
            pushing the dialog's height past the screen (that hid the Submit button on phones). */}
        <div className="flex items-center justify-center gap-6 pb-2">
          <ScoreStepper value={score1} onChange={setScore1} />
          <span className="text-muted-foreground">-</span>
          <ScoreStepper value={score2} onChange={setScore2} />
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
