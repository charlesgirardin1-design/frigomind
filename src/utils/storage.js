// -----------------------------------------------------------------------------
// storage.js
// Petit wrapper localStorage pour l'historique des recettes générées
// (fonctionnalité bonus). Aucune dépendance externe.
// -----------------------------------------------------------------------------

const HISTORY_KEY = 'frigomind_history'
const MAX_HISTORY = 20

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
