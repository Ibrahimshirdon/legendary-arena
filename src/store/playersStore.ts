import { create } from 'zustand'
import { api } from '@/lib/api'
import type { UserProfile } from '@/types'

interface PlayersState {
  players: Record<string, UserProfile>
  loading: boolean
  started: boolean
  start: () => void
  stop: () => void
  refetch: () => Promise<void>
}

let intervalId: ReturnType<typeof setInterval> | undefined

export const usePlayersStore = create<PlayersState>((set, get) => ({
  players: {},
  loading: true,
  started: false,
  refetch: async () => {
    try {
      const list = await api.get<UserProfile[]>('/users')
      const players: Record<string, UserProfile> = {}
      for (const p of list) players[p.uid] = p
      set({ players, loading: false })
    } catch {
      set({ loading: false })
    }
  },
  start: () => {
    if (get().started) return
    set({ started: true })
    void get().refetch()
    intervalId = setInterval(() => void get().refetch(), 8000)
  },
  // Called on logout so stale player data isn't visible to whoever signs in
  // next on this device, and so polling doesn't keep hitting the API for no one.
  stop: () => {
    if (intervalId) clearInterval(intervalId)
    intervalId = undefined
    set({ players: {}, loading: true, started: false })
  },
}))

export function usePlayer(uid: string | undefined | null) {
  const players = usePlayersStore((s) => s.players)
  if (!uid) return undefined
  return players[uid]
}

export function usePlayersList() {
  const players = usePlayersStore((s) => s.players)
  return Object.values(players)
}
