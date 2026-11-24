import { create } from 'zustand'
import { api } from '@/lib/api'

interface CollectionState<T> {
  items: T[]
  loading: boolean
  started: boolean
  start: () => void
  refetch: () => Promise<void>
}

/**
 * Polling replaces Firestore's onSnapshot here: there's no realtime push channel
 * from the Neon/Express backend, so each store refetches its endpoint on an interval.
 */
export function createCollectionStore<T>(path: string, intervalMs = 5000) {
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
      setInterval(() => void get().refetch(), intervalMs)
    },
  }))
}
