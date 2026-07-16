// Minimal, dependency-free service worker for basic offline support.
//
// Strategy split in two, because this is a Vite build with content-hashed
// asset filenames (e.g. index-abc123.js):
// - Navigation/HTML requests (the app shell) use network-first: always try
//   the network so a new deployment is picked up immediately, falling back
//   to the last cached shell only when offline. Caching HTML with
//   stale-while-revalidate previously meant visitors kept getting served an
//   old index.html referencing old (deployed-over) JS/CSS hashes after every
//   new deploy — this is what caused "still not requiring login" reports
//   after the login-gate change had already shipped.
// - Hashed static assets (script/style/image) stay cache-first
//   (stale-while-revalidate): a given hash's content never changes, so
//   serving it from cache is always correct and safe.
//
// Bump CACHE_VERSION whenever you want to force-invalidate old caches.
const CACHE_VERSION = 'frigomind-v3'

self.addEventListener('install', () => {
  self.skipWaiting()
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

function isSameOriginGet(request) {
  if (request.method !== 'GET') return false
  return new URL(request.url).origin === self.location.origin
}

function isNavigation(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}

function isHashedAsset(request) {
  return ['script', 'style', 'image'].includes(request.destination)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!isSameOriginGet(request)) return

  if (isNavigation(request)) {
    // Network-first: always serve the latest deployed app shell when
    // online. Only fall back to a cached copy if the network is
    // unavailable (offline support).
    event.respondWith(
      fetch(request)
        .then((response) => {
          // .clone() doit être appelé tout de suite, avant que le navigateur
          // ne commence à consommer le corps de la réponse renvoyée par
          // respondWith() — sinon, selon le timing, cache.put() peut arriver
          // trop tard et planter avec "Response body is already used".
          if (response && response.ok) {
            const responseToCache = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseToCache))
          }
          return response
        })
        .catch(() => caches.open(CACHE_VERSION).then((cache) => cache.match(request)))
    )
    return
  }

  if (isHashedAsset(request)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response && response.ok) {
                // Même raison qu'au-dessus : cloner avant de renvoyer la réponse.
                cache.put(request, response.clone())
              }
              return response
            })
            .catch(() => cached)

          return cached || networkFetch
        })
      )
    )
  }
})
