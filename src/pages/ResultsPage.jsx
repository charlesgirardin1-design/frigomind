import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { isFavoriteRecipe } from '../utils/storage.js'
import { IllustrationTile, PotGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    backEdit: '← Modifier les ingrédients',
    surpriseTitle: '🎲 Votre recette surprise',
    normalTitle: 'Vos recettes personnalisées',
    from: 'À partir de :',
    noRecipes: "Aucune recette trouvée pour l'instant — ajoutez un ou deux ingrédients de plus et réessayez.",
    anotherSurprise: '🎲 Une autre surprise',
    restart: '🔄 Recommencer avec une nouvelle photo',
    seeHistory: "📜 Voir l'historique",
  },
  en: {
    backEdit: '← Edit ingredients',
    surpriseTitle: '🎲 Your surprise recipe',
    normalTitle: 'Your personalized recipes',
    from: 'Based on:',
    noRecipes: 'No recipe found yet — add one or two more ingredients and try again.',
    anotherSurprise: '🎲 Another surprise',
    restart: '🔄 Start over with a new photo',
    seeHistory: '📜 See history',
  },
}

// Page résultats : grille de 3 à 5 recettes (ou 1 seule en mode "surprise").
export default function ResultsPage() {
  const { state, goTo, resetSession, surpriseMe, toggleFavorite, openRecipe } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]

  const checkedNames = state.ingredients.filter((i) => i.checked).map((i) => i.name)

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('validate')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        {s.backEdit}
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">
        {state.isSurprise ? s.surpriseTitle : s.normalTitle}
      </h2>
      {checkedNames.length > 0 && (
        <p className="text-neutral-500 mt-1 text-sm">
          {s.from} <span className="text-neutral-700">{checkedNames.join(', ')}</span>
        </p>
      )}

      {state.recipes.length === 0 ? (
        <div className="card p-8 text-center mt-6 flex flex-col items-center">
          <IllustrationTile tone="zest" size="lg" className="mb-4">
            <PotGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500">{s.noRecipes}</p>
        </div>
      ) : (
        <div
          className={`mt-6 grid gap-4 ${
            state.isSurprise ? 'grid-cols-1 max-w-md' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {state.recipes.map((recipe, index) => (
            <div key={recipe.id} className="animate-fadeIn" style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}>
              <RecipeCard
                recipe={recipe}
                onOpen={openRecipe}
                isFavorite={isFavoriteRecipe(state.favorites, recipe)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {state.isSurprise && (
          <button onClick={surpriseMe} className="btn-secondary">
            {s.anotherSurprise}
          </button>
        )}
        <button
          onClick={() => {
            resetSession()
            goTo('home')
          }}
          className="btn-secondary"
        >
          {s.restart}
        </button>
        <button onClick={() => goTo('history')} className="btn-secondary">
          {s.seeHistory}
        </button>
      </div>
    </div>
  )
}
