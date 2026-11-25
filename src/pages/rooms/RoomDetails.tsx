import { Check, Copy, Trash2, Trophy, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '@/components/layout/Topbar'
import { ChatPanel } from '@/components/shared/ChatPanel'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { LeaderboardTable } from '@/components/shared/LeaderboardTable'
import { PlayerCard } from '@/components/shared/PlayerCard'
import { TournamentCard } from '@/components/shared/TournamentCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { approveJoinRequest, deleteRoom, rejectJoinRequest } from '@/lib/rooms'
import { useRoomsStore, useTournamentsStore } from '@/store/appStores'
import { usePlayersList } from '@/store/playersStore'

export default function RoomDetails() {
  const { roomId } = useParams<{ roomId: string }>()
  const { profile } = useAuth()
  const { items: rooms, loading } = useRoomsStore()
  const { items: tournaments } = useTournamentsStore()
  const allPlayers = usePlayersList()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  const room = rooms.find((r) => r.id === roomId)

  if (!profile) return null
  if (loading) return null
  if (!room) {
    return <EmptyState icon={Users} title="Room not found" className="m-8" />
  }

  const isManager = profile.uid === room.ownerId || profile.role === 'admin'
  const members = allPlayers.filter((p) => room.memberIds.includes(p.uid))
  const pendingPlayers = allPlayers.filter((p) => room.pendingRequestIds.includes(p.uid))
  const roomTournaments = tournaments.filter((t) => t.roomId === room.id)

  const inviteCode = room.inviteCode
  function copyInvite() {
    void navigator.clipboard.writeText(inviteCode)
    toast.success('Invite code copied!')
  }

  const currentRoom = room
  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRoom(currentRoom)
      toast.success(`${currentRoom.name} has been deleted.`)
      navigate('/rooms')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete this community.')
      setDeleting(false)
    }
  }

  return (
    <div>
      <Topbar title={room.name} subtitle={room.description} />

      <div className="p-4 lg:p-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
                <h3 className="font-bold">About this room</h3>
                <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" /> {room.memberIds.length} members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="size-4" /> {roomTournaments.length} tournaments
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invite Code</p>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <span className="font-mono text-lg font-bold tracking-widest">{room.inviteCode}</span>
                  <button onClick={copyInvite} className="text-muted-foreground hover:text-primary">
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {profile.role === 'admin' && (
              <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                <h3 className="font-bold text-destructive">Danger Zone</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently deletes this community along with its chat, tournaments, matches, and trophies. This
                  cannot be undone.
                </p>
                <Button variant="destructive" size="sm" className="mt-3" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" /> Delete Community
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <ChatPanel roomId={room.id} isAdmin={isManager} />
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-6">
              {isManager && pendingPlayers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold">Pending Requests</h3>
                  <div className="space-y-2">
                    {pendingPlayers.map((p) => (
                      <div key={p.uid} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                        <PlayerCard player={p} />
                        <div className="ml-3 flex gap-1.5">
                          <Button size="icon" variant="outline" onClick={() => void approveJoinRequest(room, p.uid)}>
                            <Check className="size-4 text-success" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => void rejectJoinRequest(room, p.uid)}>
                            <X className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <h3 className="font-bold">Members ({members.length})</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((p) => (
                    <div key={p.uid} className="relative">
                      <PlayerCard player={p} />
                      {p.uid === room.ownerId && (
                        <Badge variant="secondary" className="absolute -top-2 right-2">
                          Owner
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tournaments">
            {roomTournaments.length === 0 ? (
              <EmptyState icon={Trophy} title="No tournaments in this room yet" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roomTournaments.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTable players={members.slice().sort((a, b) => b.stats.points - a.stats.points)} />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${room.name}?`}
        description="This permanently removes the community, its chat history, tournaments, matches, and trophies for everyone. This cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete Community'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
