import { useEffect, useState } from 'react'
import { PUSH_DISABLED_KEY, isPushDisabledByUser, pushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    pushSupported() ? Notification.permission : 'unsupported',
  )
  // Separate from the browser's permission: lets someone who already granted
  // permission still turn delivery off in-app without touching browser settings.
  const [disabledByUser, setDisabledByUser] = useState(isPushDisabledByUser)

  // Already granted and not turned off — keep the subscription fresh without
  // making the user click anything again.
  useEffect(() => {
    if (permission === 'granted' && !disabledByUser) void subscribeToPush()
  }, [permission, disabledByUser])

  async function enable() {
    if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.')

    // Some browsers (notably Chrome's "quiet" anti-spam UI) silently queue the
    // request and never resolve this promise instead of showing a prompt —
    // don't hang forever waiting for a dialog that may never appear.
    const timeout = new Promise<'default'>((resolve) => setTimeout(() => resolve('default'), 6000))
    const result = await Promise.race([Notification.requestPermission(), timeout])
    setPermission(result === 'default' ? Notification.permission : result)
    if (result === 'default') {
      throw new Error(
        'Your browser didn\'t show a permission prompt. Tap the lock/info icon next to the address bar, open "Permissions" or "Site settings", and set Notifications to Allow — then reopen this page.',
      )
    }
    if (result === 'granted') {
      try {
        localStorage.removeItem(PUSH_DISABLED_KEY)
      } catch {
        /* ignore */
      }
      setDisabledByUser(false)
      await subscribeToPush()
    }
    return result === 'granted'
  }

  async function disable() {
    await unsubscribeFromPush()
    try {
      localStorage.setItem(PUSH_DISABLED_KEY, '1')
    } catch {
      /* ignore */
    }
    setDisabledByUser(true)
  }

  return { permission, enabled: permission === 'granted' && !disabledByUser, enable, disable }
}
