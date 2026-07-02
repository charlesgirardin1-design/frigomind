import RecipeCard from '../components/RecipeCard.jsx'
import RecipeModal from '../components/RecipeModal.jsx'
import { useApp } from '../state/AppContext.jsx'
import { isFavoriteRecipe } from '../utils/storage.js'

// Page résultats : grille de 3 à 5 recettes (ou 1 seule en mode "surprise").
export default function ResultsPage() {
  const { state, setActiveRecipe, goTo, resetSession, surpriseMe, toggleFavorite } = useApp()

  const checkedNames = state.ingredients.filter((i) => i.checked).map((i) => i.name)
  const activeRecipe = state.recipes.find((r) => r.id === state.activeRecipeId) || null

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('validate')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Modifier les ingrédients
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">
        {state.isSurprise ? '🎲 Votre recette surprise' : 'Vos recettes personnalisées'}
      </h2>
      {checkedNames.length > 0 && (
        <p className="text-neutral-500 mt-1 text-sm">
          À partir de : <span className="text-neutral-700">{checkedNames.join(', ')}</span>
        </p>
      )}

      {state.recipes.length === 0 ? (
        <div className="card p-8 text-center mt-6">
          <p className="text-neutral-500">
            Aucune recette trouvée pour l'instant — ajoutez un ou deux ingrédients de plus et réessayez.
          </p>
        </div>
      ) : (
        <div
          className={`mt-6 grid gap-4 ${
            state.isSurprise ? 'grid-cols-1 max-w-md' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {state.recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={(r) => setActiveRecipe(r.id)}
              isFavorite={isFavoriteRecipe(state.favorites, recipe)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {state.isSurprise && (
          <button onClick={surpriseMe} className="btn-secondary">
            🎲 Une autre surprise
          </button>
        )}
        <button
          onClick={() => {
            resetSession()
            goTo('home')
          }}
          className="btn-secondary"
        >
          🔄 Recommencer avec une nouvelle photo
        </button>
        <button onClick={() => goTo('history')} className="btn-secondary">
          📜 Voir l'historique
        </button>
      </div>

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
