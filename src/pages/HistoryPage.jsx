import { useApp } from '../state/AppContext.jsx'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Historique (bonus) des sessions de recettes générées, persistées en localStorage.
export default function HistoryPage() {
  const { state, goTo, wipeHistory } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Accueil
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">Historique</h2>
        {state.history.length > 0 && (
          <button onClick={wipeHistory} className="text-xs text-neutral-400 hover:text-red-500">
            Effacer tout
          </button>
        )}
      </div>

      {state.history.length === 0 ? (
        <p className="text-neutral-400 mt-6 text-center">Aucune recette générée pour le moment.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {state.history.map((entry) => (
            <div key={entry.id} className="card p-4">
              <p className="text-xs text-neutral-400">{formatDate(entry.date)}</p>
              <p className="text-sm text-neutral-600 mt-1">
                Ingrédients : <span className="text-neutral-800">{entry.ingredients.join(', ') || '—'}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.recipes.map((r) => (
                  <span key={r.id} className="badge badge-neutral">
                    {r.emoji} {r.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
