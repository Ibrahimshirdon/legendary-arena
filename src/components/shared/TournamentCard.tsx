import { Calendar, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Tournament } from '@/types'

const statusVariant: Record<Tournament['status'], { label: string; variant: 'success' | 'secondary' | 'live' | 'outline' | 'default' }> = {
  upcoming: { label: 'Upcoming', variant: 'outline' },
  registration_open: { label: 'Registration Open', variant: 'secondary' },
  active: { label: 'Live', variant: 'live' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

const formatLabel: Record<Tournament['format'], string> = {
  knockout: 'Knockout',
  league: 'League',
  group_knockout: 'Groups + Knockout',
  friendly: 'Friendly',
}

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const status = statusVariant[tournament.status]
  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:glow-primary"
    >
      <div
        className="relative h-28 w-full bg-gradient-to-br from-primary/20 via-card to-secondary/10"
        style={
          tournament.bannerUrl
            ? { backgroundImage: `url(${tournament.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge variant={status.variant}>{status.variant === 'live' && '● '}{status.label}</Badge>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-bold leading-tight tracking-tight group-hover:text-primary">{tournament.name}</h3>
          <p className="text-xs text-muted-foreground">{formatLabel[tournament.format]}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" /> {tournament.registeredIds.length}/{tournament.maxPlayers} players
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" /> {formatDate(tournament.startDate)}
          </span>
        </div>
        {tournament.status === 'completed' && tournament.championId && (
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/10 px-2.5 py-1.5 text-xs font-medium text-secondary">
            <Trophy className="size-3.5" /> Champion crowned
          </div>
        )}
      </div>
    </Link>
  )
}
