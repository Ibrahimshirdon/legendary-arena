import { KeyRound, Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '@/components/layout/Topbar'
import { CreateRoomModal } from '@/components/shared/CreateRoomModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
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
import { useAuth } from '@/context/AuthContext'
import { joinByInviteCode, requestToJoin } from '@/lib/rooms'
import { useRoomsStore } from '@/store/appStores'

function JoinByCodeDialog() {
  const { profile } = useAuth()
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleJoin() {
    if (!profile || !code.trim()) return
    setSubmitting(true)
    try {
      const room = await joinByInviteCode(profile.uid, code)
      toast.success(`Joined ${room.name}!`)
      setOpen(false)
      setCode('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not join room.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <KeyRound className="size-4" /> Join with Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>Enter the invite code shared by a room admin.</DialogDescription>
        </DialogHeader>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="E.g. 7F3K9Q"
          className="text-center font-mono text-lg tracking-widest"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={submitting || !code.trim()}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function RoomsList() {
  const { profile } = useAuth()
  const { items: rooms, loading } = useRoomsStore()

  if (!profile) return null

  const myRooms = rooms.filter((r) => r.memberIds.includes(profile.uid))
  const otherRooms = rooms.filter((r) => !r.memberIds.includes(profile.uid))

  return (
    <div>
      <Topbar
        title="Community Rooms"
        subtitle="Your crews, chats, and tournaments live here."
        actions={
          <div className="flex items-center gap-2">
            <JoinByCodeDialog />
            {profile.role === 'admin' && <CreateRoomModal />}
          </div>
        }
      />

      <div className="space-y-8 p-4 lg:p-8">
        <section className="space-y-3">
          <h2 className="font-bold">My Rooms</h2>
          {loading ? (
            <ListSkeleton />
          ) : myRooms.length === 0 ? (
            <EmptyState
              icon={Users}
              title="You haven't joined a room yet"
              description="Join with an invite code or ask an admin to add you."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{room.name}</h3>
                    {room.ownerId === profile.uid && <Badge variant="secondary">Owner</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{room.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" /> {room.memberIds.length} members
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {otherRooms.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold">Other Rooms</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherRooms.map((room) => {
                const requested = room.pendingRequestIds.includes(profile.uid)
                return (
                  <div key={room.id} className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-bold">{room.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{room.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" /> {room.memberIds.length} members
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={requested}
                        onClick={() => void requestToJoin(room, profile.uid)}
                      >
                        {requested ? 'Requested' : 'Request to Join'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
