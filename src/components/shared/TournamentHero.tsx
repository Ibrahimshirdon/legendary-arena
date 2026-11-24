import { Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Tournament } from '@/types'

const formatLabel: Record<Tournament['format'], string> = {
  knockout: 'Knockout',
  league: 'League',
  group_knockout: 'Groups + Knockout',
  friendly: 'Friendly',
}

export function TournamentHero({ tournament }: { tournament: Tournament }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6 glow-primary sm:p-8"
      style={
        tournament.bannerUrl
          ? {
              backgroundImage: `linear-gradient(90deg, rgba(10,13,16,0.92), rgba(10,13,16,0.55)), url(${tournament.bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Trophy className="size-4" /> Featured Tournament
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{tournament.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatLabel[tournament.format]} &middot; {tournament.registeredIds.length} players
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to={`/tournaments/${tournament.id}`}>View Tournament</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/tournaments/${tournament.id}`}>
            <Users className="size-4" /> Players & Fixtures
          </Link>
        </Button>
      </div>
    </div>
  )
}
