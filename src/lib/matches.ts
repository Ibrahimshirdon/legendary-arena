import { api } from '@/lib/api'
import { refetchAppStores } from '@/store/appStores'
import type { Match } from '@/types'

export async function createFriendlyMatch(roomId: string, opponentId: string) {
  const match = await api.post<Match>('/matches/friendly', { roomId, opponentId })
  refetchAppStores()
  return match
}

export async function respondToChallenge(matchId: string, accept: boolean) {
  const { status } = await api.post<{ status: 'upcoming' | 'declined' }>(`/matches/${matchId}/respond-challenge`, { accept })
  refetchAppStores()
  return status
}

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
