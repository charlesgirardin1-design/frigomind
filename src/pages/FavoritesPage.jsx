import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import RecipeModal from '../components/RecipeModal.jsx'

// Page "Mes favoris" : recettes mises de côté (❤️ sur une RecipeCard),
// persistées en localStorage. Sert de réservoir de recettes pour le planning
// de la semaine.
export default function FavoritesPage() {
  const { state, goTo, toggleFavorite } = useApp()
  const [activeRecipe, setActiveRecipe] = useState(null)

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Accueil
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Mes recettes favorites</h2>
      <p className="text-neutral-500 mt-1 text-sm">
        Retrouvez ici les recettes mises de côté avec le bouton ❤️. Elles servent aussi de base pour votre
        planning de la semaine.
      </p>

      {state.favorites.length === 0 ? (
        <div className="mt-8 card p-6 text-center">
          <p className="text-neutral-500 text-sm">
            Aucun favori pour le moment. Ouvrez une recette et cliquez sur 🤍 pour la garder sous la main.
          </p>
          <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            📸 Commencer
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.favorites.map((recipe) => (
              <RecipeCard
                key={recipe.favId}
                recipe={recipe}
                onOpen={setActiveRecipe}
                isFavorite
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          <div className="mt-8 card p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              📅 Prêt·e à organiser votre semaine avec vos favoris ?
            </p>
            <button onClick={() => goTo('planning')} className="btn-primary !py-2.5 !px-5 text-sm shrink-0">
              Voir le planning
            </button>
          </div>
        </>
      )}

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
