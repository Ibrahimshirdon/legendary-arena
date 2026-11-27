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
    if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.')

    // Some browsers (notably Chrome's "quiet" anti-spam UI) silently queue the
    // request and never resolve this promise instead of showing a prompt —
    // don't hang forever waiting for a dialog that may never appear.
    const timeout = new Promise<'default'>((resolve) => setTimeout(() => resolve('default'), 6000))
    const result = await Promise.race([Notification.requestPermission(), timeout])
    setPermission(result === 'default' ? Notification.permission : result)
    if (result === 'default') {
      // Chrome sometimes suppresses the prompt entirely (its "quiet" anti-spam
      // UI) instead of asking — nothing visibly happens when that occurs.
      throw new Error(
        'Your browser didn\'t show a permission prompt. Tap the lock/info icon next to the address bar, open "Permissions" or "Site settings", and set Notifications to Allow — then reopen this page.',
      )
    }
    if (result === 'granted') await subscribeToPush()
    return result === 'granted'
  }

  return { permission, enable }
}
