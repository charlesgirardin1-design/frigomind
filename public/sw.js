// Minimal, dependency-free service worker for basic offline support.
// Strategy: cache-then-network (stale-while-revalidate) for the app shell.
// Bump CACHE_VERSION whenever you want to invalidate old caches.
const CACHE_VERSION = 'frigomind-v1'

const APP_SHELL = ['/', '/index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Only handle same-origin GET requests for navigation/document/script/style/image.
// Everything else (POST, cross-origin API/Firebase calls, etc.) is left to the network untouched.
function shouldHandle(request) {
  if (request.method !== 'GET') return false

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false

  if (request.mode === 'navigate') return true

  return ['document', 'script', 'style', 'image'].includes(request.destination)
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (!shouldHandle(request)) return

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => cached)

        // Stale-while-revalidate: serve cache immediately if present,
        // otherwise fall back to the network response.
        return cached || networkFetch
      })
    )
  )
})
