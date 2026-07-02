// -----------------------------------------------------------------------------
// storage.js
// Petit wrapper localStorage pour l'historique, les favoris et le planning de
// la semaine (fonctionnalités bonus). Aucune dépendance externe.
// -----------------------------------------------------------------------------

const HISTORY_KEY = 'frigomind_history'
const MAX_HISTORY = 20
const FAVORITES_KEY = 'frigomind_favorites'
const MAX_FAVORITES = 30
const PLANNING_KEY = 'frigomind_planning'

export const DAYS_OF_WEEK = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('FrigoMind: lecture historique impossible', e)
    return []
  }
}

export function saveHistoryEntry(entry) {
  try {
    const current = getHistory()
    const updated = [entry, ...current].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.warn('FrigoMind: écriture historique impossible', e)
    return getHistory()
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
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
// (affichage en liste, glisser-déposer dans le planning...).
export function getFavoriteKey(recipe) {
  return `${recipe.id}::${recipe.name}`
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('FrigoMind: lecture favoris impossible', e)
    return []
  }
}

export function saveFavorites(favorites) {
  const trimmed = favorites.slice(0, MAX_FAVORITES)
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.warn('FrigoMind: écriture favoris impossible', e)
  }
  return trimmed
}

export function isFavoriteRecipe(favorites, recipe) {
  const key = getFavoriteKey(recipe)
  return favorites.some((r) => getFavoriteKey(r) === key)
}

// ---------- Planning de la semaine ----------
export function getPlanning() {
  const empty = Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, null]))
  try {
    const raw = localStorage.getItem(PLANNING_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return { ...empty, ...parsed }
  } catch (e) {
    console.warn('FrigoMind: lecture planning impossible', e)
    return empty
  }
}

export function savePlanning(planning) {
  try {
    localStorage.setItem(PLANNING_KEY, JSON.stringify(planning))
  } catch (e) {
    console.warn('FrigoMind: écriture planning impossible', e)
  }
  return planning
}
