import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { cn } from '@/lib/utils'
import { usePlayer } from '@/store/playersStore'
import type { Match } from '@/types'
import { BYE } from '@/lib/fixtures'

function BracketPlayerRow({ uid, isWinner, score }: { uid: string; isWinner: boolean; score: number | null }) {
  const player = usePlayer(uid)
  const isBye = uid === BYE
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5',
        isWinner && 'bg-primary/10',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <PlayerAvatar src={player?.avatarUrl} name={isBye ? 'Bye' : player?.username ?? '—'} size="sm" />
        <span className={cn('truncate text-sm', isWinner ? 'font-bold text-foreground' : 'text-muted-foreground')}>
          {isBye ? 'BYE' : player?.username ?? 'TBD'}
        </span>
      </div>
      <span className={cn('font-mono text-sm font-bold', isWinner ? 'text-primary' : 'text-muted-foreground')}>
        {score ?? '-'}
      </span>
    </div>
  )
}

export function TournamentBracket({ matches, onMatchClick }: { matches: Match[]; onMatchClick?: (m: Match) => void }) {
  const rounds = new Map<number, Match[]>()
  for (const match of matches) {
    rounds.set(match.roundOrder, [...(rounds.get(match.roundOrder) ?? []), match])
  }
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0])

  if (sortedRounds.length === 0) {
    return <p className="text-sm text-muted-foreground">No bracket generated yet.</p>
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-2">
      {sortedRounds.map(([roundOrder, roundMatches]) => (
        <div key={roundOrder} className="flex min-w-56 flex-col justify-around gap-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {roundMatches[0]?.round}
          </p>
          <div className="flex flex-1 flex-col justify-around gap-6">
            {roundMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => onMatchClick?.(match)}
                disabled={match.player2Id === BYE}
                className="rounded-xl border border-border bg-card p-1.5 text-left transition-colors hover:border-primary/40 disabled:cursor-default"
              >
                <BracketPlayerRow
                  uid={match.player1Id}
                  isWinner={match.winnerId === match.player1Id}
                  score={match.score1}
                />
                <div className="h-px bg-border" />
                <BracketPlayerRow
                  uid={match.player2Id}
                  isWinner={match.winnerId === match.player2Id}
                  score={match.score2}
                />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
