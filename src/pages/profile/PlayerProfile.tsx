import { Calendar, Flame, Target, Trophy, Crown, ShieldCheck, Swords } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { MatchCard } from '@/components/shared/MatchCard'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { StatCard } from '@/components/shared/StatCard'
import { TrophyCard } from '@/components/shared/TrophyCard'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { computeAchievements } from '@/lib/achievements'
import { formatDate, goalDifference, winRate } from '@/lib/utils'
import { useMatchesStore, useTournamentsStore, useTrophiesStore } from '@/store/appStores'
import { usePlayer } from '@/store/playersStore'

const iconMap: Record<string, typeof Trophy> = {
  Trophy,
  Crown,
  ShieldCheck,
  Flame,
  Target,
  Swords,
}

export default function PlayerProfile() {
  const { uid } = useParams<{ uid: string }>()
  const { profile: viewer } = useAuth()
  const player = usePlayer(uid)
  const { items: matches } = useMatchesStore()
  const { items: tournaments } = useTournamentsStore()
  const { items: trophies } = useTrophiesStore()

  if (!player) {
    return <EmptyState icon={Trophy} title="Player not found" className="m-8" />
  }

  const myMatches = matches.filter((m) => m.player1Id === player.uid || m.player2Id === player.uid)
  const recentMatches = myMatches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)
  const myTrophies = trophies.filter(
    (t) => t.winnerId === player.uid || t.runnerUpId === player.uid || t.thirdPlaceId === player.uid,
  )
  const achievements = computeAchievements(player.uid, matches, tournaments)

  return (
    <div>
      <Topbar title={player.username} subtitle={player.fullName} showBack />

      <div className="space-y-6 p-4 lg:p-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-20 bg-gradient-to-r from-primary/20 via-card to-secondary/10" />
          <div className="flex flex-col items-center gap-3 p-6 pt-0 sm:flex-row sm:items-end sm:gap-5">
            <PlayerAvatar
              src={player.avatarUrl}
              name={player.username}
              size="xl"
              ring
              online={player.online}
              className="-mt-10 border-4 border-card"
            />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-xl font-black">{player.username}</h2>
                {player.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
              </div>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Calendar className="size-3.5" /> Joined {formatDate(player.createdAt)}
              </p>
              {player.favoriteTeam && <p className="mt-1 text-sm text-muted-foreground">⚽ {player.favoriteTeam}</p>}
              {player.phone && (viewer?.uid === player.uid || viewer?.role === 'admin') && (
                <p className="mt-1 text-sm text-muted-foreground">📱 {player.phone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Trophy} label="Trophies" value={player.stats.trophies} tone="gold" />
          <StatCard icon={Swords} label="Matches" value={player.stats.matchesPlayed} />
          <StatCard icon={Target} label="Win Rate" value={`${winRate(player.stats.wins, player.stats.matchesPlayed)}%`} tone="primary" />
          <StatCard icon={Flame} label="Goal Diff" value={goalDifference(player.stats.goalsFor, player.stats.goalsAgainst)} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Trophy} label="Tournaments" value={player.stats.tournamentsPlayed} />
          <StatCard icon={Swords} label="Wins" value={player.stats.wins} />
          <StatCard icon={Swords} label="Draws" value={player.stats.draws} />
          <StatCard icon={Swords} label="Losses" value={player.stats.losses} />
        </div>

        {achievements.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-bold">Achievement Badges</h3>
            <div className="flex flex-wrap gap-3">
              {achievements.map((a) => {
                const Icon = iconMap[a.icon] ?? Trophy
                return (
                  <div
                    key={a.key}
                    title={a.description}
                    className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2"
                  >
                    <Icon className="size-4 text-secondary" />
                    <span className="text-sm font-semibold">{a.label}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="font-bold">Trophy Collection</h3>
          {myTrophies.length === 0 ? (
            <EmptyState icon={Trophy} title="No trophies yet" description="Win a tournament to see it here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myTrophies.map((t) => (
                <TrophyCard key={t.id} trophy={t} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-bold">Recent Matches</h3>
          {recentMatches.length === 0 ? (
            <EmptyState icon={Swords} title="No matches played yet" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
