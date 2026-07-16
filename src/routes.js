// -----------------------------------------------------------------------------
// routes.js
// Correspondance vue <-> URL. Chaque page a sa propre adresse (partageable,
// ajoutable en favori, compatible boutons précédent/suivant du navigateur) —
// géré avec l'API History native (pushState/popstate) plutôt qu'une
// librairie de routing, pour rester sans dépendance externe (contrainte du
// projet). Piloté depuis AppContext.jsx (goTo, syncUrlToView) et App.jsx
// (chargement initial + retour/avance navigateur).
//
// Les adresses sont traduites selon la langue de l'interface (FR/EN) : voir
// pathForView(). Les deux jeux de chemins pointent vers les mêmes vues, donc
// un lien dans l'une ou l'autre langue reste toujours valide (voir
// PATH_TO_VIEW, qui fusionne les deux) — seule l'adresse affichée après
// navigation ou changement de langue suit la langue courante.
// -----------------------------------------------------------------------------

export const VIEW_PATHS_FR = {
  home: '/',
  upload: '/photo',
  validate: '/verifier',
  results: '/resultats',
  history: '/historique',
  about: '/a-propos',
  faq: '/faq',
  legal: '/mentions-legales',
  blog: '/astuces',
  stats: '/statistiques',
  changelog: '/nouveautes',
  favorites: '/favoris',
  ingredient: '/ingredient',
  recipesBrowse: '/recettes',
  recipe: '/recette',
  contact: '/contact',
  login: '/connexion',
  settings: '/parametres',
  admin: '/admin',
}

export const VIEW_PATHS_EN = {
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

// Chemin d'une vue dans une langue donnée ('/' si inconnue.)
export function pathForView(view, lang) {
  const paths = lang === 'fr' ? VIEW_PATHS_FR : VIEW_PATHS_EN
  return paths[view] || '/'
}

// Fusion des deux jeux de chemins (FR + EN) vers leur vue : une URL dans
// n'importe laquelle des deux langues doit résoudre vers la bonne page,
// quelle que soit la langue actuellement sélectionnée dans l'interface.
export const PATH_TO_VIEW = Object.fromEntries(
  [VIEW_PATHS_FR, VIEW_PATHS_EN].flatMap((paths) =>
    Object.entries(paths)
      .filter(([view]) => view !== 'home')
      .map(([view, path]) => [path, view])
  )
)

// Résout un pathname (ex: window.location.pathname) vers une vue, 'home' pour
// la racine, ou 'notfound' pour tout le reste.
export function viewFromPath(pathname) {
  if (pathname === '/' || pathname === '/index.html') return 'home'
  return PATH_TO_VIEW[pathname] || 'notfound'
}
