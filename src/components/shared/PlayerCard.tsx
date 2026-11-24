import { Link } from 'react-router-dom'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { winRate } from '@/lib/utils'
import type { UserProfile } from '@/types'

export function PlayerCard({ player }: { player: UserProfile }) {
  return (
    <Link
      to={`/profile/${player.uid}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
    >
      <PlayerAvatar src={player.avatarUrl} name={player.username} online={player.online} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{player.username}</p>
        <p className="truncate text-xs text-muted-foreground">
          {player.stats.wins}W · {winRate(player.stats.wins, player.stats.matchesPlayed)}% win rate
        </p>
      </div>
      {player.stats.trophies > 0 && (
        <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
          🏆 {player.stats.trophies}
        </span>
      )}
    </Link>
  )
}
