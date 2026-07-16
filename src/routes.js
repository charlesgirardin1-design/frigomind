// -----------------------------------------------------------------------------
// routes.js
// Correspondance vue <-> URL. Chaque page a désormais sa propre adresse
// (partageable, ajoutable en favori, compatible boutons précédent/suivant du
// navigateur) — géré avec l'API History native (pushState/popstate) plutôt
// qu'une librairie de routing, pour rester sans dépendance externe
// (contrainte du projet). Piloté depuis AppContext.jsx (goTo) et App.jsx
// (chargement initial + retour/avance navigateur).
//
// 'notfound' n'a pas d'entrée ici volontairement : toute URL qui ne
// correspond à aucune vue ci-dessous retombe sur la page 404.
// -----------------------------------------------------------------------------

export const VIEW_PATHS = {
  home: '/',
  upload: '/upload',
  validate: '/validate',
  results: '/results',
  history: '/history',
  about: '/about',
  faq: '/faq',
  legal: '/legal',
  blog: '/blog',
  stats: '/stats',
  changelog: '/changelog',
  favorites: '/favorites',
  ingredient: '/ingredient',
  recipesBrowse: '/recipes',
  recipe: '/recipe',
  contact: '/contact',
  login: '/login',
  settings: '/settings',
  admin: '/admin',
}

export const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_PATHS)
    .filter(([view]) => view !== 'home')
    .map(([view, path]) => [path, view])
)

// Résout un pathname (ex: window.location.pathname) vers une vue, 'home' pour
// la racine, ou 'notfound' pour tout le reste.
export function viewFromPath(pathname) {
  if (pathname === '/' || pathname === '/index.html') return 'home'
  return PATH_TO_VIEW[pathname] || 'notfound'
}
