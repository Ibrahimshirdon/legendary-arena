import { api } from '@/lib/api'
import { refetchAppStores } from '@/store/appStores'

export async function submitMatchResult(matchId: string, _uid: string, score1: number, score2: number) {
  const { status } = await api.post<{ status: 'completed' | 'disputed' | 'awaiting_result' }>(
    `/matches/${matchId}/submit-result`,
    { score1, score2 },
  )
  refetchAppStores()
  return status
}

export async function adminResolveMatch(matchId: string, score1: number, score2: number) {
  await api.post(`/matches/${matchId}/admin-resolve`, { score1, score2 })
  refetchAppStores()
}
