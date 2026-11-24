import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { TournamentAdminControls } from '@/components/shared/TournamentAdminControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { adminResolveMatch } from '@/lib/matches'
import { createTournament } from '@/lib/tournamentLifecycle'
import { formatDate } from '@/lib/utils'
import { useMatchesStore, useRoomsStore, useTournamentsStore } from '@/store/appStores'
import { usePlayer } from '@/store/playersStore'
import type { TournamentFormat } from '@/types'

const schema = z.object({
  roomId: z.string().min(1, 'Select a room'),
  name: z.string().min(3, 'Name is required'),
  format: z.enum(['knockout', 'league', 'group_knockout', 'friendly']),
  description: z.string().min(1, 'Add a description'),
  rules: z.string().optional(),
  startDate: z.string().min(1, 'Pick a start date'),
  registrationDeadline: z.string().min(1, 'Pick a deadline'),
  maxPlayers: z.number().min(2).max(64),
})

type FormValues = z.infer<typeof schema>

function CreateTournamentModal() {
  const { profile } = useAuth()
  const { items: rooms } = useRoomsStore()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { format: 'knockout', maxPlayers: 8, roomId: rooms[0]?.id ?? '' },
  })

  async function onSubmit(values: FormValues) {
    if (!profile) return
    setSubmitting(true)
    try {
      const tournament = await createTournament({
        roomId: values.roomId,
        name: values.name,
        description: values.description,
        bannerUrl: '',
        format: values.format,
        startDate: new Date(values.startDate).getTime(),
        registrationDeadline: new Date(values.registrationDeadline).getTime(),
        maxPlayers: values.maxPlayers,
        rules: values.rules ?? '',
        createdBy: profile.uid,
      })
      toast.success(`${tournament.name} created!`)
      reset()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create tournament.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> New Tournament
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a tournament</DialogTitle>
          <DialogDescription>Set it up, then open registration when you're ready.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room</Label>
            <Select defaultValue={rooms[0]?.id} onValueChange={(v) => setValue('roomId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && <p className="text-xs text-destructive">{errors.roomId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Legendary World Cup" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select defaultValue="knockout" onValueChange={(v) => setValue('format', v as TournamentFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="league">League</SelectItem>
                  <SelectItem value="group_knockout">Group + Knockout</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxPlayers">Max players</Label>
              <Input id="maxPlayers" type="number" min={2} max={64} {...register('maxPlayers', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registrationDeadline">Registration deadline</Label>
              <Input id="registrationDeadline" type="date" {...register('registrationDeadline')} />
              {errors.registrationDeadline && (
                <p className="text-xs text-destructive">{errors.registrationDeadline.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rules">Match rules (optional)</Label>
            <Textarea id="rules" placeholder="e.g. 6 minute halves, no pausing…" {...register('rules')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DisputeResolver({ matchId, player1Id, player2Id }: { matchId: string; player1Id: string; player2Id: string }) {
  const p1 = usePlayer(player1Id)
  const p2 = usePlayer(player2Id)
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  async function handleResolve() {
    setSubmitting(true)
    try {
      await adminResolveMatch(matchId, score1, score2)
      toast.success('Match resolved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resolve match.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <PlayerAvatar src={p1?.avatarUrl} name={p1?.username ?? '—'} size="sm" />
        {p1?.username}
        <span className="text-muted-foreground">vs</span>
        <PlayerAvatar src={p2?.avatarUrl} name={p2?.username ?? '—'} size="sm" />
        {p2?.username}
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" className="w-16" value={score1} onChange={(e) => setScore1(Number(e.target.value))} />
        <span className="text-muted-foreground">-</span>
        <Input type="number" className="w-16" value={score2} onChange={(e) => setScore2(Number(e.target.value))} />
        <Button size="sm" onClick={handleResolve} disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Resolve
        </Button>
      </div>
    </div>
  )
}

export default function AdminTournaments() {
  const { items: tournaments, loading } = useTournamentsStore()
  const { items: matches } = useMatchesStore()

  const disputed = matches.filter((m) => m.status === 'disputed')

  return (
    <div>
      <Topbar title="Tournament Management" subtitle="Create, run, and resolve every competition." actions={<CreateTournamentModal />} />

      <div className="space-y-8 p-4 lg:p-8">
        {disputed.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-bold text-destructive">
              <AlertTriangle className="size-4" /> Disputed Matches
            </h2>
            <div className="space-y-2">
              {disputed.map((m) => (
                <DisputeResolver key={m.id} matchId={m.id} player1Id={m.player1Id} player2Id={m.player2Id} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-bold">All Tournaments</h2>
          {loading ? null : tournaments.length === 0 ? (
            <EmptyState icon={Trophy} title="No tournaments yet" />
          ) : (
            <div className="space-y-3">
              {tournaments
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((t) => {
                  const tMatches = matches.filter((m) => m.tournamentId === t.id)
                  return (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                      <div>
                        <Link to={`/tournaments/${t.id}`} className="font-semibold hover:text-primary">
                          {t.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{t.status.replace('_', ' ')}</Badge>
                          <span>{formatDate(t.startDate)}</span>
                          <span>{t.registeredIds.length}/{t.maxPlayers} players</span>
                        </div>
                      </div>
                      <TournamentAdminControls tournament={t} matches={tMatches} />
                    </div>
                  )
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
