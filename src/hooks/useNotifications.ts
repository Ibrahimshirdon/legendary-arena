import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { AppNotification } from '@/types'

export function useNotifications(uid: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchNotifications() {
    try {
      const data = await api.get<AppNotification[]>('/notifications')
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!uid) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    void fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, loading, unreadCount, refetch: fetchNotifications }
}
