import { Loader2, Play, ShieldCheck, Trophy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BYE } from '@/lib/fixtures'
import {
  finalizeTournament,
  generateGroupKnockoutStage,
  generateNextKnockoutRound,
  getStandingsForTournament,
  knockoutStageMatches,
  latestRoundMatches,
  openTournamentRegistration,
  startTournament,
} from '@/lib/tournamentLifecycle'
import { usePlayer, usePlayersList } from '@/store/playersStore'
import type { Match, Tournament } from '@/types'

function PlayerName({ uid }: { uid: string }) {
  const p = usePlayer(uid)
  return <>{uid === BYE ? 'BYE' : p?.username ?? 'Unknown'}</>
}

function StartTournamentDialog({ tournament }: { tournament: Tournament }) {
  const allPlayers = usePlayersList()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<string[]>(tournament.registeredIds)

  const candidates = allPlayers.filter((p) => tournament.registeredIds.includes(p.uid))

  async function handleStart() {
    if (selected.length < 2) {
      toast.error('Select at least 2 players.')
      return
    }
    setSubmitting(true)
    try {
      await startTournament(tournament, selected)
      toast.success('Tournament started! Fixtures are live.')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start tournament.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Play className="size-4" /> Start Tournament
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm participants</DialogTitle>
          <DialogDescription>Fixtures will be generated for the selected players.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {candidates.map((p) => {
            const checked = selected.includes(p.uid)
            return (
              <label key={p.uid} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setSelected((prev) => (v ? [...prev, p.uid] : prev.filter((id) => id !== p.uid)))
                  }
                />
                <span className="text-sm">{p.username}</span>
              </label>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Start with {selected.length} players
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FinalizeTournamentDialog({ tournament, matches }: { tournament: Tournament; matches: Match[] }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const standings = getStandingsForTournament(tournament, matches)
  const finalMatch = tournament.format !== 'league' && tournament.format !== 'friendly'
    ? knockoutStageMatches(matches).find((m) => m.round === 'Final') ??
      matches.find((m) => m.round === 'Final')
    : undefined

  const suggestedChampion =
    finalMatch?.winnerId ?? standings[0]?.playerId ?? tournament.participantIds[0]
  const suggestedRunnerUp =
    (finalMatch && (finalMatch.winnerId === finalMatch.player1Id ? finalMatch.player2Id : finalMatch.player1Id)) ??
    standings[1]?.playerId

  const [championId, setChampionId] = useState(suggestedChampion)
  const [runnerUpId, setRunnerUpId] = useState(suggestedRunnerUp ?? '')
  const [thirdPlaceId, setThirdPlaceId] = useState(standings[2]?.playerId ?? '')

  const realParticipants = tournament.participantIds.filter((id) => id !== BYE)

  async function handleFinalize() {
    if (!championId || !runnerUpId) {
      toast.error('Select both champion and runner-up.')
      return
    }
    setSubmitting(true)
    try {
      await finalizeTournament(tournament, {
        championId,
        runnerUpId,
        thirdPlaceId: thirdPlaceId || undefined,
      })
      toast.success('Tournament finalized! Trophy added to the Hall of Fame.')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not finalize tournament.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Trophy className="size-4" /> Finalize Tournament
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crown the champion</DialogTitle>
          <DialogDescription>This locks the tournament and adds a trophy to the Hall of Fame.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {[
            { label: 'Champion', value: championId, setter: setChampionId },
            { label: 'Runner-up', value: runnerUpId, setter: setRunnerUpId },
            { label: 'Third place (optional)', value: thirdPlaceId, setter: setThirdPlaceId },
          ].map(({ label, value, setter }) => (
            <div key={label} className="space-y-1.5">
              <Label>{label}</Label>
              <Select value={value} onValueChange={setter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {realParticipants.map((id) => (
                    <SelectItem key={id} value={id}>
                      <PlayerName uid={id} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleFinalize} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Finalize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GenerateKnockoutStageButton({ tournament, matches }: { tournament: Tournament; matches: Match[] }) {
  const [advanceCount, setAdvanceCount] = useState(4)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleGenerate() {
    setSubmitting(true)
    try {
      await generateGroupKnockoutStage(tournament, matches, advanceCount)
      toast.success('Knockout stage generated!')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate knockout stage.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <ShieldCheck className="size-4" /> Generate Knockout Stage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close group stage</DialogTitle>
          <DialogDescription>Top finishers from the group table advance to the knockout bracket.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Players advancing</Label>
          <Input type="number" min={2} value={advanceCount} onChange={(e) => setAdvanceCount(Number(e.target.value))} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TournamentAdminControls({ tournament, matches }: { tournament: Tournament; matches: Match[] }) {
  async function openRegistration() {
    await openTournamentRegistration(tournament)
    toast.success('Registration is now open!')
  }

  async function generateNextRound() {
    try {
      const result = await generateNextKnockoutRound(tournament)
      if (result.finished) {
        toast.success('Final complete! Finalize the tournament to crown a champion.')
      } else {
        toast.success('Next round generated!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate next round.')
    }
  }

  if (tournament.status === 'upcoming') {
    return (
      <Button size="sm" onClick={() => void openRegistration()}>
        Open Registration
      </Button>
    )
  }

  if (tournament.status === 'registration_open') {
    return <StartTournamentDialog tournament={tournament} />
  }

  if (tournament.status === 'active') {
    if (tournament.format === 'knockout') {
      const currentRound = latestRoundMatches(matches)
      const allDone = currentRound.length > 0 && currentRound.every((m) => m.status === 'completed')
      const isFinal = currentRound[0]?.round === 'Final'
      if (allDone && isFinal) return <FinalizeTournamentDialog tournament={tournament} matches={matches} />
      if (allDone) {
        return (
          <Button size="sm" onClick={() => void generateNextRound()}>
            Generate Next Round
          </Button>
        )
      }
      return null
    }

    if (tournament.format === 'group_knockout') {
      const knockout = knockoutStageMatches(matches)
      if (knockout.length === 0) {
        return <GenerateKnockoutStageButton tournament={tournament} matches={matches} />
      }
      const currentRound = latestRoundMatches(knockout)
      const allDone = currentRound.every((m) => m.status === 'completed')
      const isFinal = currentRound[0]?.round === 'Final'
      if (allDone && isFinal) return <FinalizeTournamentDialog tournament={tournament} matches={matches} />
      if (allDone) {
        return (
          <Button size="sm" onClick={() => void generateNextRound()}>
            Generate Next Round
          </Button>
        )
      }
      return null
    }

    return <FinalizeTournamentDialog tournament={tournament} matches={matches} />
  }

  return null
}
