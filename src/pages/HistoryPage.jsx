import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SkeletonCard from '../components/Skeleton.jsx'
import { IllustrationTile, ClockGlyph } from '../components/Illustrations.jsx'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Historique (bonus) des sessions de recettes générées, persistées en localStorage.
export default function HistoryPage() {
  const { state, goTo, wipeHistory } = useApp()
  const { authLoading } = useAuth()
  // Fenêtre de chargement : le temps que Firebase confirme la session avant
  // que state.history ne soit peuplé. On affiche des squelettes plutôt que
  // le message "aucune recette", qui sinon flasherait avant les vraies données.
  const isLoadingUserData = authLoading

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel="← Accueil"
        icon={<ClockGlyph className="w-full h-full" />}
        title="Historique"
        subtitle="Vos sessions de recettes générées, conservées localement sur cet appareil."
        action={
          state.history.length > 0 && (
            <button onClick={wipeHistory} className="text-xs text-neutral-400 hover:text-red-500">
              Effacer tout
            </button>
          )
        }
      />

      {isLoadingUserData ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : state.history.length === 0 ? (
        <div className="mt-8 card p-8 text-center flex flex-col items-center">
          <IllustrationTile tone="neutral" size="lg" className="mb-4">
            <ClockGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500 text-sm max-w-xs">Aucune recette générée pour le moment.</p>
          <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            📸 Commencer
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {state.history.map((entry, index) => (
            <div
              key={entry.id}
              className="card p-4 animate-fadeIn"
              style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
            >
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
