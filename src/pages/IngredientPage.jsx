import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { findRecipesUsingIngredient } from '../logic/recipeEngine.js'
import { isPerishable, isPantryStaple } from '../data/expiryData.js'
import { isFavoriteRecipe } from '../utils/storage.js'
import RecipeCard from '../components/RecipeCard.jsx'
import RecipeModal from '../components/RecipeModal.jsx'

// Page "Ingrédient" : cherchez un ingrédient (ou cliquez dessus depuis une
// recette ou vos statistiques) pour voir toutes les recettes de la base qui
// l'utilisent, plus une astuce de conservation anti-gaspi.
export default function IngredientPage() {
  const { state, goTo, goToIngredient, toggleFavorite } = useApp()
  const [query, setQuery] = useState(state.activeIngredient || '')
  const [activeRecipe, setActiveRecipe] = useState(null)

  const name = state.activeIngredient?.trim()
  const matches = name ? findRecipesUsingIngredient(name) : []

  function handleSearch(e) {
    e.preventDefault()
    goToIngredient(query)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Accueil
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Recettes par ingrédient</h2>
      <p className="text-neutral-500 mt-1 text-sm">
        Cherchez un ingrédient pour voir toutes les recettes qui l'utilisent, avec une astuce de conservation
        pour éviter de le gaspiller.
      </p>

      <form onSubmit={handleSearch} className="mt-5 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ex : champignons"
          className="flex-1 text-sm border border-neutral-200 rounded-full px-4 py-2.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
        />
        <button type="submit" className="btn-secondary !py-2.5 !px-5 text-sm shrink-0">
          Chercher
        </button>
      </form>

      {name && (
        <>
          <div className="mt-6 card p-4">
            <h3 className="font-semibold text-neutral-900 capitalize">{name}</h3>
            {isPantryStaple(name) ? (
              <p className="text-sm text-neutral-500 mt-1">
                🧂 Ingrédient de base : se conserve longtemps, toujours utile d'en avoir sous la main.
              </p>
            ) : isPerishable(name) ? (
              <p className="text-sm text-zest-700 mt-1">
                ♻️ Périssable : à cuisiner rapidement (quelques jours au frigo en général) pour éviter le
                gaspillage.
              </p>
            ) : (
              <p className="text-sm text-neutral-500 mt-1">
                Se conserve en général plusieurs jours à quelques semaines selon le mode de conservation.
              </p>
            )}
          </div>

          <h3 className="mt-6 font-semibold text-neutral-900">
            {matches.length > 0
              ? `${matches.length} recette${matches.length > 1 ? 's' : ''} avec ${name}`
              : `Aucune recette trouvée avec "${name}"`}
          </h3>

          {matches.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpen={setActiveRecipe}
                  isFavorite={isFavoriteRecipe(state.favorites, recipe)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 card p-6 text-center">
              <p className="text-neutral-500 text-sm">
                Essayez un autre nom, ou scannez votre frigo pour découvrir des recettes adaptées à ce que vous
                avez vraiment.
              </p>
              <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
                📸 Scanner mes ingrédients
              </button>
            </div>
          )}
        </>
      )}

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
