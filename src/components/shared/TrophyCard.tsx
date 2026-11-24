import { Medal, Trophy } from 'lucide-react'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { formatDate } from '@/lib/utils'
import { usePlayer } from '@/store/playersStore'
import type { Trophy as TrophyType } from '@/types'

export function TrophyCard({ trophy }: { trophy: TrophyType }) {
  const champion = usePlayer(trophy.winnerId)
  const runnerUp = usePlayer(trophy.runnerUpId)
  const third = usePlayer(trophy.thirdPlaceId)

  return (
    <div className="overflow-hidden rounded-2xl border border-secondary/20 bg-card">
      <div className="flex items-center gap-2 bg-secondary/10 px-5 py-3">
        <Trophy className="size-4 text-secondary" />
        <span className="text-sm font-bold">{trophy.tournamentName}</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(trophy.date)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-5">
        <div className="flex flex-col items-center gap-2">
          <PlayerAvatar src={champion?.avatarUrl} name={champion?.username ?? 'Champion'} size="lg" ring />
          <Medal className="size-4 text-secondary" />
          <span className="text-center text-xs font-semibold leading-tight">{champion?.username ?? '—'}</span>
          <span className="text-[10px] text-muted-foreground">Champion</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlayerAvatar src={runnerUp?.avatarUrl} name={runnerUp?.username ?? 'Runner up'} size="md" />
          <Medal className="size-3.5 text-muted-foreground" />
          <span className="text-center text-xs font-semibold leading-tight">{runnerUp?.username ?? '—'}</span>
          <span className="text-[10px] text-muted-foreground">Runner-up</span>
        </div>
        {trophy.thirdPlaceId ? (
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar src={third?.avatarUrl} name={third?.username ?? 'Third'} size="md" />
            <Medal className="size-3.5 text-amber-700" />
            <span className="text-center text-xs font-semibold leading-tight">{third?.username ?? '—'}</span>
            <span className="text-[10px] text-muted-foreground">Third place</span>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
