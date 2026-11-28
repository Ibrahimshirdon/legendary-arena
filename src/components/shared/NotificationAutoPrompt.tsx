import { useEffect } from 'react'
import { pushSupported, subscribeToPush } from '@/lib/push'

const ATTEMPTED_KEY = 'push-auto-prompt-attempted'

/**
 * Browsers only grant notification permission in response to a genuine user
 * gesture, and requesting it cold on page load is a known anti-pattern that
 * makes Chrome's spam-prevention heuristics more likely to silently suppress
 * the prompt. So instead of a button the user has to go find in Settings,
 * this quietly asks on their very first tap/click anywhere in the app —
 * still a real gesture, but nothing they have to seek out. Tried at most
 * once ever per browser; after that it's manual via Settings.
 */
export function NotificationAutoPrompt() {
  useEffect(() => {
    if (!pushSupported() || Notification.permission !== 'default') return
    try {
      if (localStorage.getItem(ATTEMPTED_KEY)) return
    } catch {
      return
    }

    function onFirstInteraction() {
      try {
        localStorage.setItem(ATTEMPTED_KEY, '1')
      } catch {
        /* ignore */
      }
      Notification.requestPermission()
        .then((result) => {
          if (result === 'granted') void subscribeToPush()
        })
        .catch(() => {})
    }

    window.addEventListener('click', onFirstInteraction, { once: true, capture: true })
    return () => window.removeEventListener('click', onFirstInteraction, { capture: true })
  }, [])

  return null
}
