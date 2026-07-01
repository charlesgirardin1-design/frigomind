import { useMemo } from 'react'
import { useApp } from '../state/AppContext.jsx'

// Calcule quelques statistiques simples à partir de l'historique local
// (sessions les plus récentes uniquement, voir note en bas de page).
function computeStats(history) {
  const sessions = history.length
  const totalRecipes = history.reduce((sum, entry) => sum + (entry.recipes?.length || 0), 0)

  const ingredientCounts = {}
  history.forEach((entry) => {
    ;(entry.ingredients || []).forEach((name) => {
      const key = name.trim().toLowerCase()
      if (!key) return
      ingredientCounts[key] = (ingredientCounts[key] || 0) + 1
    })
  })
  const topIngredients = Object.entries(ingredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const recipeCounts = {}
  history.forEach((entry) => {
    ;(entry.recipes || []).forEach((r) => {
      const key = r.name
      if (!recipeCounts[key]) recipeCounts[key] = { name: r.name, emoji: r.emoji, count: 0 }
      recipeCounts[key].count += 1
    })
  })
  const topRecipes = Object.values(recipeCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { sessions, totalRecipes, topIngredients, topRecipes }
}

// Page "Statistiques" : petit bonus gamifié basé sur l'historique local
// (localStorage), sans envoi de données à un serveur.
export default function StatsPage() {
  const { state, goTo } = useApp()
  const stats = useMemo(() => computeStats(state.history), [state.history])
  const hasData = stats.sessions > 0

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Retour
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Vos statistiques</h2>
      <p className="text-neutral-500 mt-1 text-sm">
        Un petit résumé de votre activité sur FrigoMind, calculé à partir de votre historique local.
      </p>

      {!hasData ? (
        <div className="mt-8 card p-6 text-center">
          <p className="text-neutral-500 text-sm">
            Pas encore de statistiques : générez vos premières recettes pour voir apparaître vos chiffres ici.
          </p>
          <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            📸 Commencer
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <div className="text-3xl font-extrabold text-fresh-700">{stats.sessions}</div>
              <p className="text-sm text-neutral-500 mt-1">
                session{stats.sessions > 1 ? 's' : ''} de recettes générée{stats.sessions > 1 ? 's' : ''}
              </p>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-extrabold text-fresh-700">{stats.totalRecipes}</div>
              <p className="text-sm text-neutral-500 mt-1">
                recette{stats.totalRecipes > 1 ? 's' : ''} reçue{stats.totalRecipes > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>

          {stats.topIngredients.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900 mb-2">Vos ingrédients les plus fréquents</h3>
              <div className="flex flex-wrap gap-2">
                {stats.topIngredients.map(([name, count]) => (
                  <span key={name} className="chip">
                    {name} <span className="text-neutral-400">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {stats.topRecipes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900 mb-2">Vos recettes les plus recommandées</h3>
              <div className="space-y-2">
                {stats.topRecipes.map((r) => (
                  <div key={r.name} className="card p-3 flex items-center justify-between">
                    <span className="text-sm text-neutral-800">
                      {r.emoji} {r.name}
                    </span>
                    <span className="badge badge-fresh">×{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 text-xs text-neutral-400 text-center">
            Calculé sur vos {stats.sessions} dernière{stats.sessions > 1 ? 's' : ''} session
            {stats.sessions > 1 ? 's' : ''} enregistrée{stats.sessions > 1 ? 's' : ''} sur cet appareil
            (l'historique local conserve au maximum les 20 dernières). Rien n'est envoyé à un serveur.
          </p>
        </>
      )}
    </div>
  )
}
