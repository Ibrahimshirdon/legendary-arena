import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { GridSkeleton } from '@/components/shared/LoadingSkeleton'
import { TournamentCard } from '@/components/shared/TournamentCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { useRoomsStore, useTournamentsStore } from '@/store/appStores'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Live' },
  { value: 'registration_open', label: 'Open' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
]

export default function TournamentsList() {
  const { profile } = useAuth()
  const { items: tournaments, loading } = useTournamentsStore()
  const { items: rooms } = useRoomsStore()
  const [filter, setFilter] = useState('all')

  if (!profile) return null

  const myRoomIds = rooms.filter((r) => r.memberIds.includes(profile.uid)).map((r) => r.id)
  const visible = tournaments.filter((t) => myRoomIds.includes(t.roomId))
  const filtered = filter === 'all' ? visible : visible.filter((t) => t.status === filter)

  return (
    <div>
      <Topbar
        title="Tournaments"
        subtitle="Browse, register, and track every cup in your community."
        actions={
          profile.role === 'admin' ? (
            <Button asChild size="sm">
              <Link to="/admin/tournaments">Manage Tournaments</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/requests">Request Tournament</Link>
            </Button>
          )
        }
      />

      <div className="p-4 lg:p-8">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="mb-4 flex-wrap">
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={filter}>
            {loading ? (
              <GridSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState icon={Trophy} title="No tournaments here" description="Check back soon or request one." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
