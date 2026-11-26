import { Clock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { BYE } from '@/lib/fixtures'
import { respondToChallenge } from '@/lib/matches'
import { formatDateTime } from '@/lib/utils'
import { usePlayer } from '@/store/playersStore'
import type { Match } from '@/types'

const statusConfig: Record<Match['status'], { label: string; variant: 'outline' | 'secondary' | 'success' | 'destructive' }> = {
  challenge_pending: { label: 'Challenge Pending', variant: 'secondary' },
  upcoming: { label: 'Upcoming', variant: 'outline' },
  awaiting_result: { label: 'Awaiting Result', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'success' },
  disputed: { label: 'Disputed', variant: 'destructive' },
}

function PlayerSide({ uid, align }: { uid: string; align: 'left' | 'right' }) {
  const player = usePlayer(uid)
  const isBye = uid === BYE
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2.5 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <PlayerAvatar src={player?.avatarUrl} name={isBye ? 'Bye' : player?.username ?? '—'} size="sm" />
      <span className="min-w-0 truncate text-sm font-semibold">{isBye ? 'BYE' : player?.username ?? 'Unknown'}</span>
    </div>
  )
}

export function MatchCard({ match, onClick }: { match: Match; onClick?: () => void }) {
  const { profile } = useAuth()
  const [responding, setResponding] = useState(false)
  const status = statusConfig[match.status]
  const hasScore = match.score1 !== null && match.score2 !== null
  const isPending = match.status === 'challenge_pending'
  const isRecipient = isPending && profile?.uid === match.player2Id
  const isSender = isPending && profile?.uid === match.player1Id

  async function respond(accept: boolean) {
    setResponding(true)
    try {
      await respondToChallenge(match.id, accept)
      toast.success(accept ? 'Challenge accepted! Good luck.' : 'Challenge declined.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not respond to the challenge.')
    } finally {
      setResponding(false)
    }
  }

  return (
    <div
      role={isPending ? undefined : 'button'}
      tabIndex={isPending ? undefined : 0}
      onClick={isPending ? undefined : onClick}
      className={`w-full rounded-2xl border border-border bg-card p-4 text-left ${
        isPending ? '' : 'cursor-pointer transition-colors hover:border-primary/40'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{match.round}</span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-3">
        <PlayerSide uid={match.player1Id} align="left" />
        <div className="shrink-0 rounded-lg bg-muted px-3 py-1 text-center font-mono text-sm font-bold">
          {hasScore ? `${match.score1} - ${match.score2}` : 'vs'}
        </div>
        <PlayerSide uid={match.player2Id} align="right" />
      </div>

      {isRecipient ? (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" className="flex-1" disabled={responding} onClick={() => void respond(true)}>
            {responding && <Loader2 className="size-4 animate-spin" />} Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" disabled={responding} onClick={() => void respond(false)}>
            Decline
          </Button>
        </div>
      ) : isSender ? (
        <p className="mt-3 text-xs text-muted-foreground">Waiting for your opponent to respond…</p>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {formatDateTime(match.scheduledAt)}
        </div>
      )}
    </div>
  )
}
