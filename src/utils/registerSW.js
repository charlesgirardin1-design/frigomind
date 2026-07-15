// Minimal service worker registration for basic offline / PWA support.
// No build-time plugin involved (kept dependency-free): the service worker
// itself lives at public/sw.js and is served as-is by Vite.
export function registerSW() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      // A failed registration should never break the app.
      console.warn('Service worker registration failed:', error)
    })
  })
}
