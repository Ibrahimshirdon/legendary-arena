import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { LeaderboardTable } from '@/components/shared/LeaderboardTable'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { goalDifference, winRate } from '@/lib/utils'
import { usePlayersList } from '@/store/playersStore'
import type { UserProfile } from '@/types'

const categories = [
  { value: 'points', label: 'All-Time Points' },
  { value: 'trophies', label: 'Most Trophies' },
  { value: 'wins', label: 'Most Wins' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'goalDifference', label: 'Goal Difference' },
]

function sortPlayers(players: UserProfile[], category: string) {
  const list = [...players]
  switch (category) {
    case 'trophies':
      return list.sort((a, b) => b.stats.trophies - a.stats.trophies)
    case 'wins':
      return list.sort((a, b) => b.stats.wins - a.stats.wins)
    case 'winRate':
      return list.sort(
        (a, b) =>
          winRate(b.stats.wins, b.stats.matchesPlayed) - winRate(a.stats.wins, a.stats.matchesPlayed),
      )
    case 'goalDifference':
      return list.sort(
        (a, b) =>
          goalDifference(b.stats.goalsFor, b.stats.goalsAgainst) -
          goalDifference(a.stats.goalsFor, a.stats.goalsAgainst),
      )
    default:
      return list.sort((a, b) => b.stats.points - a.stats.points)
  }
}

function Podium({ players }: { players: UserProfile[] }) {
  const [first, second, third] = players
  if (!first) return null
  return (
    <div className="flex items-end justify-center gap-3 rounded-2xl border border-border bg-card p-6 pitch-pattern">
      {second && <PodiumSlot player={second} place={2} height="h-24" />}
      <PodiumSlot player={first} place={1} height="h-32" />
      {third && <PodiumSlot player={third} place={3} height="h-16" />}
    </div>
  )
}

function PodiumSlot({ player, place, height }: { player: UserProfile; place: 1 | 2 | 3; height: string }) {
  const color = place === 1 ? 'bg-secondary text-secondary-foreground' : place === 2 ? 'bg-muted-foreground/40 text-foreground' : 'bg-amber-800/40 text-foreground'
  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <PlayerAvatar src={player.avatarUrl} name={player.username} size={place === 1 ? 'xl' : 'lg'} ring={place === 1} />
      <p className="truncate text-sm font-bold">{player.username}</p>
      <p className="text-xs text-muted-foreground">{player.stats.points} pts</p>
      <div className={`flex w-full ${height} items-start justify-center rounded-t-lg pt-1.5 text-lg font-black ${color}`}>
        {place}
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const players = usePlayersList().filter((p) => p.status === 'approved')
  const [category, setCategory] = useState('points')

  const sorted = sortPlayers(players, category)

  if (players.length === 0) {
    return (
      <div>
        <Topbar title="Leaderboard" subtitle="Rankings across your whole community." />
        <div className="p-8">
          <EmptyState icon={Trophy} title="No ranked players yet" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Topbar title="Leaderboard" subtitle="Rankings across your whole community." />
      <div className="space-y-6 p-4 lg:p-8">
        <Podium players={sorted.slice(0, 3)} />
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap">
            {categories.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={category}>
            <LeaderboardTable players={sorted} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
