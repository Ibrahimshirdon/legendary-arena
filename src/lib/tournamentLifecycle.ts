import { api } from '@/lib/api'
import { computeStandings } from '@/lib/standings'
import { refetchAppStores } from '@/store/appStores'
import type { Match, PointSystem, Tournament, TournamentFormat, TournamentRequest } from '@/types'

export async function registerForTournament(tournament: Tournament, _uid: string) {
  await api.post(`/tournaments/${tournament.id}/register`)
  refetchAppStores()
}

export async function cancelRegistration(tournament: Tournament, _uid: string) {
  await api.post(`/tournaments/${tournament.id}/cancel-registration`)
  refetchAppStores()
}

export async function removeRegistration(tournament: Tournament, userId: string) {
  await api.post(`/tournaments/${tournament.id}/remove-registration`, { userId })
  refetchAppStores()
}

export async function openTournamentRegistration(tournament: Tournament) {
  await api.post(`/tournaments/${tournament.id}/open-registration`)
  refetchAppStores()
}

export async function startTournament(tournament: Tournament, participantIds: string[]) {
  await api.post(`/tournaments/${tournament.id}/start`, { participantIds })
  refetchAppStores()
}

export async function generateNextKnockoutRound(tournament: Tournament) {
  const result = await api.post<{ finished: boolean; champion?: string }>(
    `/tournaments/${tournament.id}/generate-next-round`,
  )
  refetchAppStores()
  return result.finished ? { finished: true as const, champion: result.champion } : { finished: false as const }
}

export async function generateGroupKnockoutStage(tournament: Tournament, _matches: Match[], advanceCount: number) {
  await api.post(`/tournaments/${tournament.id}/generate-knockout-stage`, { advanceCount })
  refetchAppStores()
}

interface FinalizeResult {
  championId: string
  runnerUpId: string
  thirdPlaceId?: string
}

export async function finalizeTournament(tournament: Tournament, result: FinalizeResult) {
  await api.post(`/tournaments/${tournament.id}/finalize`, result)
  refetchAppStores()
}

export async function createTournament(input: {
  roomId: string
  name: string
  description: string
  bannerUrl: string
  format: TournamentFormat
  startDate: number
  registrationDeadline: number
  maxPlayers: number
  rules: string
  createdBy: string
  pointSystem?: PointSystem
}) {
  const tournament = await api.post<Tournament>('/tournaments', input)
  refetchAppStores()
  return tournament
}

export async function approveAndConvertRequest(
  request: TournamentRequest,
  extra: { bannerUrl: string; rules: string; registrationDeadline: number; maxPlayers?: number },
) {
  const { tournamentId } = await api.post<{ tournamentId: string }>(`/tournament-requests/${request.id}/approve`, extra)
  refetchAppStores()
  return { id: tournamentId } as Tournament
}

export async function rejectRequest(request: TournamentRequest, reason: string) {
  await api.post(`/tournament-requests/${request.id}/reject`, { reason })
  refetchAppStores()
}

export async function postponeRequest(request: TournamentRequest, note: string) {
  await api.post(`/tournament-requests/${request.id}/postpone`, { note })
  refetchAppStores()
}

export function latestRoundMatches(matches: Match[]) {
  if (matches.length === 0) return []
  const maxOrder = Math.max(...matches.map((m) => m.roundOrder))
  return matches.filter((m) => m.roundOrder === maxOrder)
}

const KNOCKOUT_STAGE_ROUND_OFFSET = 1000

export function getStandingsForTournament(tournament: Tournament, matches: Match[]) {
  const relevant =
    tournament.format === 'group_knockout'
      ? matches.filter((m) => m.roundOrder < KNOCKOUT_STAGE_ROUND_OFFSET)
      : matches
  return computeStandings(tournament.participantIds, relevant, tournament.pointSystem)
}

export function groupStageMatches(matches: Match[]) {
  return matches.filter((m) => m.roundOrder < KNOCKOUT_STAGE_ROUND_OFFSET)
}

export function knockoutStageMatches(matches: Match[]) {
  return matches.filter((m) => m.roundOrder >= KNOCKOUT_STAGE_ROUND_OFFSET)
}
