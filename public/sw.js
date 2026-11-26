// Minimal service worker whose only job is to make the app installable
// (Chrome/Android require a controlling service worker for the install prompt).
// It deliberately does no caching, so it never serves stale data.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
