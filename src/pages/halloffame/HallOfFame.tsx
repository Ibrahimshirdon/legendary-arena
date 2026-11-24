import { Trophy } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrophyCard } from '@/components/shared/TrophyCard'
import { useTrophiesStore } from '@/store/appStores'

export default function HallOfFame() {
  const { items: trophies, loading } = useTrophiesStore()

  const sorted = trophies.slice().sort((a, b) => b.date - a.date)

  return (
    <div>
      <Topbar title="Hall of Fame" subtitle="Every champion, immortalized forever." />
      <div className="p-4 lg:p-8">
        {loading ? null : sorted.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No champions yet"
            description="The first trophy in Legendary Arena history is still up for grabs."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t) => (
              <TrophyCard key={t.id} trophy={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
