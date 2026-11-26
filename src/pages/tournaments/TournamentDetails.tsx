import { Calendar, ListChecks, Swords, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { LeagueTable } from '@/components/shared/LeagueTable'
import { MatchCard } from '@/components/shared/MatchCard'
import { MatchResultModal } from '@/components/shared/MatchResultModal'
import { PlayerCard } from '@/components/shared/PlayerCard'
import { TournamentAdminControls } from '@/components/shared/TournamentAdminControls'
import { TournamentBracket } from '@/components/shared/TournamentBracket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { BYE } from '@/lib/fixtures'
import { cancelRegistration, getStandingsForTournament, groupStageMatches, knockoutStageMatches, registerForTournament } from '@/lib/tournamentLifecycle'
import { formatDate } from '@/lib/utils'
import { useMatchesStore, useTournamentsStore } from '@/store/appStores'
import { usePlayersList } from '@/store/playersStore'
import type { Match } from '@/types'

const formatLabel = {
  knockout: 'Knockout',
  league: 'League',
  group_knockout: 'Groups + Knockout',
  friendly: 'Friendly',
}

export default function TournamentDetails() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { profile } = useAuth()
  const { items: tournaments, loading } = useTournamentsStore()
  const { items: allMatches } = useMatchesStore()
  const allPlayers = usePlayersList()
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  // Tab lives in the URL so clicking into a participant's profile and hitting
  // Back restores the tab you were on, instead of resetting to Overview.
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'overview'
  function setTab(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', value)
        return next
      },
      { replace: true },
    )
  }

  const tournament = tournaments.find((t) => t.id === tournamentId)

  if (!profile || loading) return null
  if (!tournament) return <EmptyState icon={Trophy} title="Tournament not found" className="m-8" />

  const matches = allMatches.filter((m) => m.tournamentId === tournament.id)
  const participants = allPlayers.filter((p) => tournament.participantIds.includes(p.uid))
  const registered = allPlayers.filter((p) => tournament.registeredIds.includes(p.uid))
  const isRegistered = tournament.registeredIds.includes(profile.uid)
  const canRegister = tournament.status === 'registration_open' && !isRegistered
  const myMatches = matches.filter(
    (m) => (m.player1Id === profile.uid || m.player2Id === profile.uid) && m.player2Id !== BYE,
  )

  const currentTournament = tournament
  const uid = profile.uid

  async function handleRegister() {
    try {
      await registerForTournament(currentTournament, uid)
      toast.success('You are registered!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not register.')
    }
  }

  const isGroupKnockout = tournament.format === 'group_knockout'
  const isKnockout = tournament.format === 'knockout'
  const standings = getStandingsForTournament(tournament, matches)
  const groupMatches = isGroupKnockout ? groupStageMatches(matches) : matches
  const bracketMatches = isGroupKnockout ? knockoutStageMatches(matches) : matches

  return (
    <div>
      <Topbar
        title={tournament.name}
        subtitle={`${formatLabel[tournament.format]} · ${formatDate(tournament.startDate)}`}
        showBack
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canRegister && <Button size="sm" onClick={() => void handleRegister()}>Join Tournament</Button>}
            {isRegistered && tournament.status === 'registration_open' && (
              <Button size="sm" variant="outline" onClick={() => void cancelRegistration(tournament, profile.uid)}>
                Cancel Registration
              </Button>
            )}
            {profile.role === 'admin' && <TournamentAdminControls tournament={tournament} matches={matches} />}
          </div>
        }
      />

      <div className="p-4 lg:p-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            {(tournament.format === 'league' || tournament.format === 'friendly' || isGroupKnockout) && (
              <TabsTrigger value="standings">Standings</TabsTrigger>
            )}
            {(isKnockout || isGroupKnockout) && <TabsTrigger value="bracket">Bracket</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Badge>{formatLabel[tournament.format]}</Badge>
                <Badge variant="outline">{tournament.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tournament.description}</p>
              {tournament.rules && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Match Rules</p>
                  <p className="mt-1 text-sm">{tournament.rules}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" /> Starts {formatDate(tournament.startDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" /> {tournament.registeredIds.length}/{tournament.maxPlayers} registered
                </span>
                <span className="flex items-center gap-1.5">
                  <ListChecks className="size-4" /> Win {tournament.pointSystem.win} · Draw {tournament.pointSystem.draw} · Loss{' '}
                  {tournament.pointSystem.loss}
                </span>
              </div>
            </div>

            {myMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold">Your Matches</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {myMatches.map((m) => (
                    <MatchCard key={m.id} match={m} onClick={() => setActiveMatch(m)} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants">
            {(tournament.status === 'upcoming' || tournament.status === 'registration_open') && registered.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {registered.map((p) => (
                  <PlayerCard key={p.uid} player={p} />
                ))}
              </div>
            ) : participants.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {participants.map((p) => (
                  <PlayerCard key={p.uid} player={p} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No players yet" description="Registered players will appear here." />
            )}
          </TabsContent>

          <TabsContent value="fixtures">
            {matches.length === 0 ? (
              <EmptyState icon={Swords} title="Fixtures not generated yet" description="They'll appear once the tournament starts." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {matches
                  .slice()
                  .sort((a, b) => a.roundOrder - b.roundOrder)
                  .map((m) => (
                    <MatchCard key={m.id} match={m} onClick={() => setActiveMatch(m)} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="standings">
            {groupMatches.length === 0 ? (
              <EmptyState icon={ListChecks} title="No matches played yet" />
            ) : (
              <LeagueTable rows={standings} />
            )}
          </TabsContent>

          <TabsContent value="bracket">
            <TournamentBracket matches={bracketMatches} onMatchClick={setActiveMatch} />
          </TabsContent>
        </Tabs>
      </div>

      {activeMatch && (
        <MatchResultModal match={activeMatch} open={Boolean(activeMatch)} onOpenChange={(v) => !v && setActiveMatch(null)} />
      )}
    </div>
  )
}
