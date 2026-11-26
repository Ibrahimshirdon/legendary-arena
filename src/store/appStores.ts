import { createCollectionStore } from '@/store/createCollectionStore'
import type { Match, Room, Tournament, TournamentRequest, Trophy } from '@/types'

export const useRoomsStore = createCollectionStore<Room>('/rooms', 6000)
export const useTournamentsStore = createCollectionStore<Tournament>('/tournaments', 6000)
export const useMatchesStore = createCollectionStore<Match>('/matches', 5000)
export const useTrophiesStore = createCollectionStore<Trophy>('/trophies', 15000)
export const useTournamentRequestsStore = createCollectionStore<TournamentRequest>('/tournament-requests', 8000)

export function startAppStores() {
  useRoomsStore.getState().start()
  useTournamentsStore.getState().start()
  useMatchesStore.getState().start()
  useTrophiesStore.getState().start()
  useTournamentRequestsStore.getState().start()
}

export function stopAppStores() {
  useRoomsStore.getState().stop()
  useTournamentsStore.getState().stop()
  useMatchesStore.getState().stop()
  useTrophiesStore.getState().stop()
  useTournamentRequestsStore.getState().stop()
}

export function refetchAppStores() {
  void useRoomsStore.getState().refetch()
  void useTournamentsStore.getState().refetch()
  void useMatchesStore.getState().refetch()
  void useTrophiesStore.getState().refetch()
  void useTournamentRequestsStore.getState().refetch()
}
