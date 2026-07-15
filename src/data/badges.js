// -----------------------------------------------------------------------------
// badges.js
// Petits badges "anti-gaspi" calculés uniquement à partir de données déjà
// stockées localement (historique + favoris, voir AppContext.jsx) — aucune
// nouvelle collecte, aucun envoi serveur.
// -----------------------------------------------------------------------------

export const BADGE_DEFS = [
  { id: 'first', emoji: '🥕', metric: 'sessions', threshold: 1 },
  { id: 'regular', emoji: '🍳', metric: 'sessions', threshold: 5 },
  { id: 'chef', emoji: '👨‍🍳', metric: 'sessions', threshold: 15 },
  { id: 'antiGaspi', emoji: '♻️', metric: 'antiGaspiCount', threshold: 5 },
  { id: 'favorites', emoji: '⭐', metric: 'favoritesCount', threshold: 5 },
  { id: 'critic', emoji: '📝', metric: 'ratedCount', threshold: 3 },
]

// `history` : state.history (voir AppContext), `favorites` : state.favorites.
export function computeBadgeStats(history, favorites) {
  const sessions = history.length
  const antiGaspiCount = history.reduce(
    (sum, entry) => sum + (entry.recipes || []).filter((r) => r.antiGaspi).length,
    0
  )
  const favoritesCount = favorites.length
  const ratedCount = favorites.filter((r) => (r.rating || 0) > 0).length
  return { sessions, antiGaspiCount, favoritesCount, ratedCount }
}

export function computeBadges(stats) {
  return BADGE_DEFS.map((def) => ({
    ...def,
    current: stats[def.metric] || 0,
    earned: (stats[def.metric] || 0) >= def.threshold,
  }))
}
