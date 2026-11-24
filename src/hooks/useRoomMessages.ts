import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/types'

export function useRoomMessages(roomId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return

    let cancelled = false
    async function fetchMessages() {
      try {
        const data = await api.get<ChatMessage[]>(`/rooms/${roomId}/messages`)
        if (!cancelled) setMessages(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    void fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [roomId])

  return { messages, loading }
}
