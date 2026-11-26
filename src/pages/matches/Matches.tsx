import { Swords } from 'lucide-react'
import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { MatchCard } from '@/components/shared/MatchCard'
import { MatchResultModal } from '@/components/shared/MatchResultModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { useMatchesStore, useRoomsStore } from '@/store/appStores'
import type { Match } from '@/types'

const filters = [
  { value: 'mine', label: 'My Matches' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'awaiting_result', label: 'Awaiting Result' },
  { value: 'completed', label: 'Completed' },
  { value: 'disputed', label: 'Disputed' },
]

export default function Matches() {
  const { profile } = useAuth()
  const { items: matches, loading } = useMatchesStore()
  const { items: rooms } = useRoomsStore()
  const [filter, setFilter] = useState('mine')
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  if (!profile) return null

  const myRoomIds = rooms.filter((r) => r.memberIds.includes(profile.uid)).map((r) => r.id)
  const visible = matches.filter((m) => myRoomIds.includes(m.roomId))

  const filtered =
    filter === 'mine'
      ? visible.filter((m) => m.player1Id === profile.uid || m.player2Id === profile.uid)
      : visible.filter((m) => m.status === filter)

  const sorted = filtered.slice().sort((a, b) => b.scheduledAt - a.scheduledAt)

  return (
    <div>
      <Topbar title="Matches" subtitle="Every tournament fixture and friendly challenge, in one place." />
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
            {loading ? null : sorted.length === 0 ? (
              <EmptyState icon={Swords} title="No matches here" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((m) => (
                  <MatchCard key={m.id} match={m} onClick={() => setActiveMatch(m)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {activeMatch && (
        <MatchResultModal match={activeMatch} open={Boolean(activeMatch)} onOpenChange={(v) => !v && setActiveMatch(null)} />
      )}
    </div>
  )
}
