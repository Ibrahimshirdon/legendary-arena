import { api } from '@/lib/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export const PUSH_DISABLED_KEY = 'push-disabled-by-user'

export function isPushDisabledByUser() {
  try {
    return localStorage.getItem(PUSH_DISABLED_KEY) === '1'
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function pushSupported() {
  return VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function subscribeToPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    })
  }
  await api.post('/notifications/push/subscribe', subscription.toJSON())
}

export async function unsubscribeFromPush() {
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await api.post('/notifications/push/unsubscribe', { endpoint }).catch(() => {})
}
