import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import type { StandingRow } from '@/lib/standings'
import { usePlayer } from '@/store/playersStore'

export function LeagueTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Player</th>
            <th className="px-3 py-3 text-center">P</th>
            <th className="px-3 py-3 text-center">W</th>
            <th className="px-3 py-3 text-center">D</th>
            <th className="px-3 py-3 text-center">L</th>
            <th className="px-3 py-3 text-center">GF</th>
            <th className="px-3 py-3 text-center">GA</th>
            <th className="px-3 py-3 text-center">GD</th>
            <th className="px-4 py-3 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <StandingRowItem key={row.playerId} row={row} rank={index + 1} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StandingRowItem({ row, rank }: { row: StandingRow; rank: number }) {
  const player = usePlayer(row.playerId)
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-accent/60">
      <td className="px-4 py-3 font-semibold text-muted-foreground">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PlayerAvatar src={player?.avatarUrl} name={player?.username ?? '—'} size="sm" />
          <span className="font-medium">{player?.username ?? 'Unknown'}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.played}</td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.wins}</td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.draws}</td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.losses}</td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.goalsFor}</td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.goalsAgainst}</td>
      <td className="px-3 py-3 text-center text-muted-foreground">{row.goalDifference}</td>
      <td className="px-4 py-3 text-center font-bold text-primary">{row.points}</td>
    </tr>
  )
}
