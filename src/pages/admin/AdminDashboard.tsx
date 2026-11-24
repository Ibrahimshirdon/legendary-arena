import { AlertTriangle, MailQuestion, ShieldCheck, Trophy, UserCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Topbar } from '@/components/layout/Topbar'
import { AdminStatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useMatchesStore, useRoomsStore, useTournamentRequestsStore, useTournamentsStore } from '@/store/appStores'
import { usePlayer, usePlayersList } from '@/store/playersStore'

export default function AdminDashboard() {
  const players = usePlayersList()
  const { items: rooms } = useRoomsStore()
  const { items: tournaments } = useTournamentsStore()
  const { items: matches } = useMatchesStore()
  const { items: requests } = useTournamentRequestsStore()

  const pendingUsers = players.filter((p) => p.status === 'pending')
  const disputedMatches = matches.filter((m) => m.status === 'disputed')
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const activeTournaments = tournaments.filter((t) => t.status === 'active')

  return (
    <div>
      <Topbar title="Admin Dashboard" subtitle="The command center for Legendary Arena." />

      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <AdminStatCard icon={Users} label="Players" value={players.length} tone="primary" />
          <AdminStatCard icon={ShieldCheck} label="Rooms" value={rooms.length} />
          <AdminStatCard icon={Trophy} label="Tournaments" value={tournaments.length} tone="gold" />
          <AdminStatCard icon={Trophy} label="Active" value={activeTournaments.length} tone="primary" />
          <AdminStatCard icon={AlertTriangle} label="Disputed" value={disputedMatches.length} />
          <AdminStatCard icon={MailQuestion} label="Pending Requests" value={pendingRequests.length} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Pending Approvals</h2>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/users">Manage Users</Link>
              </Button>
            </div>
            {pendingUsers.length === 0 ? (
              <EmptyState icon={UserCheck} title="No pending approvals" />
            ) : (
              <div className="space-y-2">
                {pendingUsers.map((p) => (
                  <div key={p.uid} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                    <span className="text-sm font-semibold">{p.username}</span>
                    <span className="text-xs text-muted-foreground">{p.email}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Disputed Matches</h2>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/tournaments">Resolve</Link>
              </Button>
            </div>
            {disputedMatches.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No disputes right now" />
            ) : (
              <div className="space-y-2">
                {disputedMatches.map((m) => (
                  <DisputeRow key={m.id} player1Id={m.player1Id} player2Id={m.player2Id} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function DisputeRow({ player1Id, player2Id }: { player1Id: string; player2Id: string }) {
  const p1 = usePlayer(player1Id)
  const p2 = usePlayer(player2Id)
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
      {p1?.username ?? '—'} vs {p2?.username ?? '—'} — scores disagree
    </div>
  )
}
