import { Bell, Megaphone, Swords, Target, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { GridSkeleton } from '@/components/shared/LoadingSkeleton'
import { MatchCard } from '@/components/shared/MatchCard'
import { StatCard } from '@/components/shared/StatCard'
import { TournamentHero } from '@/components/shared/TournamentHero'
import { Button } from '@/components/ui/button'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { winRate } from '@/lib/utils'
import { useMatchesStore, useTournamentsStore } from '@/store/appStores'
import { usePlayersList } from '@/store/playersStore'

export default function Dashboard() {
  const { profile } = useAuth()
  const { items: tournaments, loading: loadingTournaments } = useTournamentsStore()
  const { items: matches } = useMatchesStore()
  const { notifications } = useNotifications(profile?.uid)
  const allPlayers = usePlayersList()

  if (!profile) return null

  const activeTournament = tournaments.find((t) => t.status === 'active') ?? tournaments.find((t) => t.status === 'registration_open')

  const myMatches = matches.filter((m) => m.player1Id === profile.uid || m.player2Id === profile.uid)
  const upcoming = myMatches.filter((m) => m.status === 'upcoming' || m.status === 'awaiting_result').slice(0, 3)
  const recent = myMatches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3)

  const recentActivity = notifications.slice(0, 5)

  const rankedPlayers = allPlayers
    .filter((p) => p.status === 'approved')
    .sort((a, b) => b.stats.points - a.stats.points)
  const myRank = rankedPlayers.findIndex((p) => p.uid === profile.uid) + 1

  return (
    <div>
      <Topbar title={`Welcome back, ${profile.username} ⚽`} subtitle="Here's what's happening in your arena." />

      <div className="space-y-6 p-4 lg:p-8">
        {loadingTournaments ? (
          <GridSkeleton items={1} />
        ) : activeTournament ? (
          <TournamentHero tournament={activeTournament} />
        ) : (
          <EmptyState
            icon={Trophy}
            title="No active tournament right now"
            description="Ask your admin to open one, or submit a request yourself."
            action={
              <Button asChild size="sm">
                <Link to="/requests">Request a tournament</Link>
              </Button>
            }
          />
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Swords} label="Wins" value={profile.stats.wins} tone="primary" />
          <StatCard icon={Trophy} label="Trophies" value={profile.stats.trophies} tone="gold" />
          <StatCard icon={Target} label="Win Rate" value={`${winRate(profile.stats.wins, profile.stats.matchesPlayed)}%`} />
          <StatCard icon={Users} label="Rank" value={myRank > 0 ? `#${myRank}` : '—'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="font-bold">Upcoming Matches</h2>
            {upcoming.length === 0 ? (
              <EmptyState icon={Swords} title="No upcoming matches" description="You're all caught up." />
            ) : (
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-bold">Recent Results</h2>
            {recent.length === 0 ? (
              <EmptyState icon={Trophy} title="No results yet" description="Play your first match to see it here." />
            ) : (
              <div className="space-y-3">
                {recent.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="font-bold">Community Activity</h2>
            {recentActivity.length === 0 ? (
              <EmptyState icon={Bell} title="Nothing new" description="Activity will show up here." />
            ) : (
              <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
                {recentActivity.map((n) => (
                  <div key={n.id} className="border-b border-border py-2 text-sm last:border-b-0">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-bold">Latest Announcements</h2>
            <EmptyState
              icon={Megaphone}
              title="Check your rooms"
              description="Room announcements show up inside each community room's chat."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/rooms">Go to Community</Link>
                </Button>
              }
            />
          </section>
        </div>
      </div>
    </div>
  )
}
