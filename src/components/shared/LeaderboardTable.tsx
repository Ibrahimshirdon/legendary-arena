import { Link } from 'react-router-dom'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { cn, goalDifference, winRate } from '@/lib/utils'
import type { UserProfile } from '@/types'

const rankStyles = [
  'bg-secondary/15 text-secondary border-secondary/30',
  'bg-muted text-foreground border-border',
  'bg-primary/15 text-primary border-primary/30',
]

export function LeaderboardTable({ players }: { players: UserProfile[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden grid-cols-12 gap-2 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
        <span className="col-span-1">#</span>
        <span className="col-span-4">Player</span>
        <span className="col-span-1 text-center">Pts</span>
        <span className="col-span-1 text-center">MP</span>
        <span className="col-span-1 text-center">W</span>
        <span className="col-span-1 text-center">D/L</span>
        <span className="col-span-1 text-center">GD</span>
        <span className="col-span-1 text-center">Win%</span>
        <span className="col-span-1 text-center">🏆</span>
      </div>

      {players.map((player, index) => (
        <Link
          key={player.uid}
          to={`/profile/${player.uid}`}
          className="grid grid-cols-12 items-center gap-2 border-b border-border px-5 py-3.5 text-sm transition-colors last:border-b-0 hover:bg-accent"
        >
          <span
            className={cn(
              'col-span-1 flex size-7 items-center justify-center rounded-lg border text-xs font-bold',
              index < 3 ? rankStyles[index] : 'border-border text-muted-foreground',
            )}
          >
            {index + 1}
          </span>
          <span className="col-span-7 flex items-center gap-2.5 lg:col-span-4">
            <PlayerAvatar src={player.avatarUrl} name={player.username} size="sm" />
            <span className="truncate font-semibold">{player.username}</span>
          </span>
          <span className="col-span-2 text-center font-bold text-primary lg:col-span-1">{player.stats.points}</span>
          <span className="hidden text-center text-muted-foreground lg:col-span-1 lg:block">
            {player.stats.matchesPlayed}
          </span>
          <span className="hidden text-center text-muted-foreground lg:col-span-1 lg:block">{player.stats.wins}</span>
          <span className="hidden text-center text-muted-foreground lg:col-span-1 lg:block">
            {player.stats.draws}/{player.stats.losses}
          </span>
          <span className="hidden text-center text-muted-foreground lg:col-span-1 lg:block">
            {goalDifference(player.stats.goalsFor, player.stats.goalsAgainst)}
          </span>
          <span className="hidden text-center text-muted-foreground lg:col-span-1 lg:block">
            {winRate(player.stats.wins, player.stats.matchesPlayed)}%
          </span>
          <span className="col-span-2 text-center font-semibold text-secondary lg:col-span-1">
            {player.stats.trophies}
          </span>
        </Link>
      ))}
    </div>
  )
}
