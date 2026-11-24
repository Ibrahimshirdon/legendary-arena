import { Ban, Check, Crown, ShieldOff, UserMinus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Topbar } from '@/components/layout/Topbar'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { setUserRole, setUserStatus } from '@/lib/admin'
import { usePlayersList } from '@/store/playersStore'
import type { UserProfile } from '@/types'

export default function AdminUsers() {
  const { profile } = useAuth()
  const players = usePlayersList()
  const [tab, setTab] = useState('pending')

  if (!profile) return null

  const grouped: Record<string, UserProfile[]> = {
    pending: players.filter((p) => p.status === 'pending'),
    approved: players.filter((p) => p.status === 'approved'),
    banned: players.filter((p) => p.status === 'banned' || p.status === 'rejected'),
  }

  return (
    <div>
      <Topbar title="User Management" subtitle="Approve, promote, or restrict community members." />
      <div className="p-4 lg:p-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({grouped.pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({grouped.approved.length})</TabsTrigger>
            <TabsTrigger value="banned">Restricted ({grouped.banned.length})</TabsTrigger>
          </TabsList>
          {Object.entries(grouped).map(([key, list]) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-2">
                {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nothing here.</p>}
                {list.map((p) => (
                  <UserRow key={p.uid} player={p} currentUid={profile.uid} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

function UserRow({ player, currentUid }: { player: UserProfile; currentUid: string }) {
  const [banOpen, setBanOpen] = useState(false)
  const isSelf = player.uid === currentUid

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <PlayerAvatar src={player.avatarUrl} name={player.username} size="sm" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{player.username}</p>
            {player.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{player.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {player.status === 'pending' && (
          <>
            <Button size="sm" onClick={() => void setUserStatus(player.uid, 'approved')}>
              <Check className="size-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => void setUserStatus(player.uid, 'rejected')}>
              <X className="size-4" /> Reject
            </Button>
          </>
        )}

        {player.status === 'approved' && !isSelf && (
          <>
            {player.role === 'admin' ? (
              <Button size="sm" variant="outline" onClick={() => void setUserRole(player.uid, 'member')}>
                <ShieldOff className="size-4" /> Demote
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => void setUserRole(player.uid, 'admin')}>
                <Crown className="size-4" /> Promote
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => setBanOpen(true)}>
              <Ban className="size-4" /> Ban
            </Button>
          </>
        )}

        {(player.status === 'banned' || player.status === 'rejected') && (
          <Button size="sm" variant="outline" onClick={() => void setUserStatus(player.uid, 'approved')}>
            <UserMinus className="size-4" /> Reinstate
          </Button>
        )}
      </div>

      <ConfirmationDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        title={`Ban ${player.username}?`}
        description="They will lose access to the community immediately."
        confirmLabel="Ban user"
        variant="destructive"
        onConfirm={() => {
          void setUserStatus(player.uid, 'banned')
          toast.success(`${player.username} has been banned.`)
          setBanOpen(false)
        }}
      />
    </div>
  )
}
