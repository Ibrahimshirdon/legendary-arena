// Minimal service worker: makes the app installable (Chrome/Android require a
// controlling service worker for the install prompt) and shows Web Push
// notifications. It deliberately does no caching, so it never serves stale data.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Already has the app open and visible — they'll see it in-app within
      // a few seconds via polling, no need to also pop a system notification.
      const appIsVisible = clients.some((c) => c.visibilityState === 'visible')
      if (appIsVisible) return undefined
      return self.registration.showNotification(data.title ?? 'Legendary Arena', {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: data.url ?? '/' },
      })
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
