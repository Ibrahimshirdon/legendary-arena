import { Clock } from 'lucide-react'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { usePlayer } from '@/store/playersStore'
import type { Match } from '@/types'
import { BYE } from '@/lib/fixtures'

const statusConfig: Record<Match['status'], { label: string; variant: 'outline' | 'secondary' | 'success' | 'destructive' }> = {
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
  const status = statusConfig[match.status]
  const hasScore = match.score1 !== null && match.score2 !== null

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
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

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> {formatDateTime(match.scheduledAt)}
      </div>
    </button>
  )
}
