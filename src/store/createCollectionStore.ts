import { create } from 'zustand'
import { api } from '@/lib/api'

interface CollectionState<T> {
  items: T[]
  loading: boolean
  started: boolean
  start: () => void
  stop: () => void
  refetch: () => Promise<void>
}

/**
 * Polling replaces Firestore's onSnapshot here: there's no realtime push channel
 * from the Neon/Express backend, so each store refetches its endpoint on an interval.
 */
export function createCollectionStore<T>(path: string, intervalMs = 5000) {
  let intervalId: ReturnType<typeof setInterval> | undefined

  return create<CollectionState<T>>((set, get) => ({
    items: [],
    loading: true,
    started: false,
    refetch: async () => {
      try {
        const items = await api.get<T[]>(path)
        set({ items, loading: false })
      } catch {
        set({ loading: false })
      }
    },
    start: () => {
      if (get().started) return
      set({ started: true })
      void get().refetch()
      intervalId = setInterval(() => void get().refetch(), intervalMs)
    },
    // Called on logout so stale data isn't visible to whoever signs in next
    // on this device, and so polling doesn't keep hitting the API for no one.
    stop: () => {
      if (intervalId) clearInterval(intervalId)
      intervalId = undefined
      set({ items: [], loading: true, started: false })
    },
  }))
}
