import { useEffect, useState } from 'react'
import { pushSupported, subscribeToPush } from '@/lib/push'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    pushSupported() ? Notification.permission : 'unsupported',
  )

  // Already granted in a past session — keep the subscription fresh without
  // making the user click anything again.
  useEffect(() => {
    if (permission === 'granted') void subscribeToPush()
  }, [permission])

  async function enable() {
    if (!pushSupported()) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') await subscribeToPush()
    return result === 'granted'
  }

  return { permission, enable }
}
