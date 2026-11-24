import { Loader2, MailQuestion, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { TournamentRequestModal } from '@/components/shared/TournamentRequestModal'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { approveAndConvertRequest, postponeRequest, rejectRequest } from '@/lib/tournamentLifecycle'
import { formatDate } from '@/lib/utils'
import { useRoomsStore, useTournamentRequestsStore } from '@/store/appStores'
import { usePlayer } from '@/store/playersStore'
import type { TournamentRequest } from '@/types'
import { useNavigate } from 'react-router-dom'

const statusVariant: Record<TournamentRequest['status'], 'outline' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'outline',
  approved: 'success',
  rejected: 'destructive',
  postponed: 'secondary',
}

function RequesterLine({ uid }: { uid: string }) {
  const player = usePlayer(uid)
  return <span className="font-semibold">{player?.username ?? 'Unknown'}</span>
}

function ApproveDialog({ request }: { request: TournamentRequest }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rules, setRules] = useState('Standard rules. Fair play, no exploits.')
  const [maxPlayers, setMaxPlayers] = useState(request.numPlayers)
  const [deadline, setDeadline] = useState('')

  async function handleApprove() {
    setSubmitting(true)
    try {
      const tournament = await approveAndConvertRequest(request, {
        bannerUrl: '',
        rules,
        registrationDeadline: deadline ? new Date(deadline).getTime() : request.proposedDate,
        maxPlayers,
      })
      toast.success('Request approved and tournament created!')
      setOpen(false)
      navigate(`/tournaments/${tournament.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Approve & Create</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve request</DialogTitle>
          <DialogDescription>This creates a live tournament from "{request.name}".</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Max players</Label>
            <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Registration deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Match rules</Label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReasonDialog({
  label,
  onConfirm,
}: {
  label: string
  onConfirm: (reason: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await onConfirm(reason)
      setOpen(false)
      setReason('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>Let the requester know why (optional).</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason…" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TournamentRequests() {
  const { profile } = useAuth()
  const { items: requests, loading } = useTournamentRequestsStore()
  const { items: rooms } = useRoomsStore()

  if (!profile) return null

  const isAdmin = profile.role === 'admin'
  const myRooms = rooms.filter((r) => r.memberIds.includes(profile.uid))
  const visibleRequests = isAdmin
    ? requests
    : requests.filter((r) => r.requesterId === profile.uid)
  const sorted = visibleRequests.slice().sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div>
      <Topbar
        title="Tournament Requests"
        subtitle={isAdmin ? 'Review and manage requests from your community.' : 'Pitch your next tournament idea.'}
        actions={
          <TournamentRequestModal
            rooms={myRooms}
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> New Request
              </Button>
            }
          />
        }
      />

      <div className="space-y-3 p-4 lg:p-8">
        {loading ? null : sorted.length === 0 ? (
          <EmptyState icon={MailQuestion} title="No requests yet" description="Submit the first one!" />
        ) : (
          sorted.map((request) => (
            <div key={request.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{request.name}</h3>
                    <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Requested by <RequesterLine uid={request.requesterId} /> &middot; {formatDate(request.proposedDate)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{request.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Format: {request.format.replace('_', ' + ')}</span>
                <span>Players: {request.numPlayers}</span>
              </div>
              {request.message && <p className="mt-2 text-sm italic text-muted-foreground">"{request.message}"</p>}
              {request.adminNote && (
                <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-semibold">Admin note:</span> {request.adminNote}
                </p>
              )}

              {isAdmin && request.status === 'pending' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <ApproveDialog request={request} />
                  <ReasonDialog label="Reject" onConfirm={(reason) => rejectRequest(request, reason)} />
                  <ReasonDialog label="Postpone" onConfirm={(reason) => postponeRequest(request, reason)} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
