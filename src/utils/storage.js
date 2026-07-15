// -----------------------------------------------------------------------------
// storage.js
// Petit wrapper localStorage pour l'historique, les favoris et les
// préférences (fonctionnalités bonus). Tout est propre au compte connecté
// (clé suffixée par son uid) : sur un même appareil, deux comptes FrigoMind
// ne partagent jamais leur historique/favoris/stats.
// Aucune dépendance externe.
// -----------------------------------------------------------------------------

const HISTORY_KEY = 'frigomind_history'
const MAX_HISTORY = 20
const FAVORITES_KEY = 'frigomind_favorites'
const MAX_FAVORITES = 30
const PREFERENCES_KEY = 'frigomind_preferences'

export const DEFAULT_PREFERENCES = { maxTime: 'peu importe', cuisine: 'toutes', vegetarien: false }

// Sans compte connecté (ne devrait pas arriver : ces données ne sont
// utilisées que sur des pages qui exigent une connexion), on retombe sur un
// compartiment "invité" plutôt que de planter.
export function scopedKey(base, uid) {
  return `${base}_${uid || 'guest'}`
}

export function getHistory(uid) {
  try {
    const raw = localStorage.getItem(scopedKey(HISTORY_KEY, uid))
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('FrigoMind: lecture historique impossible', e)
    return []
  }
}

export function saveHistoryEntry(uid, entry) {
  try {
    const current = getHistory(uid)
    const updated = [entry, ...current].slice(0, MAX_HISTORY)
    localStorage.setItem(scopedKey(HISTORY_KEY, uid), JSON.stringify(updated))
    return updated
  } catch (e) {
    console.warn('FrigoMind: écriture historique impossible', e)
    return getHistory(uid)
  }
}

export function clearHistory(uid) {
  try {
    localStorage.removeItem(scopedKey(HISTORY_KEY, uid))
  } catch (e) {
    console.warn('FrigoMind: suppression historique impossible', e)
  }
}

// ---------- Favoris ----------
// Les recettes générées à la volée (voir buildGenericRecipes dans
// recipeEngine.js) réutilisent le même id d'un batch à l'autre : on ne peut
// donc pas se fier à `recipe.id` seul pour distinguer deux favoris. On
// combine id + nom (qui embarque la liste d'ingrédients pour les recettes
// génériques) pour obtenir une clé stable, et on attribue un `favId` unique
// à chaque favori pour les usages qui ont besoin d'une clé 100% sûre
// (affichage en liste, etc.).
export function getFavoriteKey(recipe) {
  return `${recipe.id}::${recipe.name}`
}

export function getFavorites(uid) {
  try {
    const raw = localStorage.getItem(scopedKey(FAVORITES_KEY, uid))
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('FrigoMind: lecture favoris impossible', e)
    return []
  }
}

export function saveFavorites(uid, favorites) {
  const trimmed = favorites.slice(0, MAX_FAVORITES)
  try {
    localStorage.setItem(scopedKey(FAVORITES_KEY, uid), JSON.stringify(trimmed))
  } catch (e) {
    console.warn('FrigoMind: écriture favoris impossible', e)
  }
  return trimmed
}

export function isFavoriteRecipe(favorites, recipe) {
  const key = getFavoriteKey(recipe)
  return favorites.some((r) => getFavoriteKey(r) === key)
}

// ---------- Préférences par défaut ----------
// Dernières préférences de recettes utilisées (temps max, cuisine, régime),
// réappliquées automatiquement à chaque nouvelle session sur ce compte.
export function getPreferences(uid) {
  try {
    const raw = localStorage.getItem(scopedKey(PREFERENCES_KEY, uid))
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES
  } catch (e) {
    console.warn('FrigoMind: lecture préférences impossible', e)
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(uid, preferences) {
  try {
    localStorage.setItem(scopedKey(PREFERENCES_KEY, uid), JSON.stringify(preferences))
  } catch (e) {
    console.warn('FrigoMind: écriture préférences impossible', e)
  }
  return preferences
}

// ---------- Photo de profil ----------
// Aucun stockage serveur (Firebase Storage) n'est configuré pour ce MVP : la
// photo de profil (prise avec l'appareil ou importée) est donc gardée en
// local, propre à cet appareil, plutôt que synchronisée sur le compte.
function avatarKey(uid) {
  return `frigomind_avatar_${uid}`
}

export function getAvatar(uid) {
  if (!uid) return null
  try {
    return localStorage.getItem(avatarKey(uid))
  } catch (e) {
    console.warn('FrigoMind: lecture photo de profil impossible', e)
    return null
  }
}

export function saveAvatar(uid, dataUrl) {
  try {
    localStorage.setItem(avatarKey(uid), dataUrl)
  } catch (e) {
    console.warn('FrigoMind: écriture photo de profil impossible', e)
  }
  return dataUrl
}

export function clearAvatar(uid) {
  try {
    localStorage.removeItem(avatarKey(uid))
  } catch (e) {
    console.warn('FrigoMind: suppression photo de profil impossible', e)
  }
}
