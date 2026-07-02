import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import RecipeModal from '../components/RecipeModal.jsx'
import { DAYS_OF_WEEK } from '../utils/storage.js'
import { dedupeIngredientList, copyTextToClipboard } from '../utils/shoppingList.js'

const DAY_LABELS = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
}

// Page "Planning de la semaine" : on assigne des recettes favorites aux 7
// jours, par glisser-déposer (desktop) ou en sélectionnant une recette puis
// en touchant un jour (mobile, plus fiable que le drag-and-drop tactile).
// En bas, liste de courses agrégée sur toutes les recettes de la semaine.
export default function PlanningPage() {
  const { state, goTo, assignRecipeToDay, clearDay } = useApp()
  const [selectedFavId, setSelectedFavId] = useState(null)
  const [activeRecipe, setActiveRecipe] = useState(null)
  const [copied, setCopied] = useState(false)

  const favorites = state.favorites
  const selectedRecipe = favorites.find((r) => r.favId === selectedFavId) || null

  function handleDragStart(e, recipe) {
    e.dataTransfer.setData('text/plain', recipe.favId)
  }

  function handleDrop(e, day) {
    e.preventDefault()
    const favId = e.dataTransfer.getData('text/plain')
    const recipe = favorites.find((r) => r.favId === favId)
    if (recipe) assignRecipeToDay(day, recipe)
  }

  function handleDayClick(day) {
    const assigned = state.planning[day]
    if (assigned) {
      setActiveRecipe(assigned)
      return
    }
    if (selectedRecipe) {
      assignRecipeToDay(day, selectedRecipe)
      setSelectedFavId(null)
    }
  }

  const weekRecipes = DAYS_OF_WEEK.map((day) => state.planning[day]).filter(Boolean)
  const shoppingList = dedupeIngredientList(weekRecipes.flatMap((r) => r.missingIngredients || []))

  async function handleCopy() {
    const ok = await copyTextToClipboard(shoppingList.join('\n'))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Accueil
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Planning de la semaine</h2>
      <p className="text-neutral-500 mt-1 text-sm">
        Glissez une recette favorite sur un jour (ou touchez-la pour la sélectionner, puis touchez un jour sur
        mobile).
      </p>

      {favorites.length === 0 ? (
        <div className="mt-8 card p-6 text-center">
          <p className="text-neutral-500 text-sm">
            Ajoutez d'abord des recettes à vos favoris (❤️) pour pouvoir les planifier ici.
          </p>
          <button onClick={() => goTo('favorites')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            ❤️ Voir mes favoris
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <h3 className="font-semibold text-neutral-900 mb-2 text-sm">Vos recettes favorites</h3>
            <div className="flex flex-wrap gap-2">
              {favorites.map((recipe) => (
                <button
                  key={recipe.favId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, recipe)}
                  onClick={() => setSelectedFavId(selectedFavId === recipe.favId ? null : recipe.favId)}
                  className={`chip cursor-grab active:cursor-grabbing ${
                    selectedFavId === recipe.favId ? 'chip-active' : ''
                  }`}
                >
                  {recipe.emoji} {recipe.name}
                </button>
              ))}
            </div>
            {selectedRecipe && (
              <p className="text-xs text-fresh-700 mt-2">
                « {selectedRecipe.name} » sélectionnée — touchez un jour pour l'y assigner.
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const recipe = state.planning[day]
              return (
                <div
                  key={day}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={() => handleDayClick(day)}
                  className={`card p-4 cursor-pointer min-h-[84px] flex flex-col justify-center transition ${
                    !recipe && selectedRecipe ? 'border-fresh-300 bg-fresh-50/40' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                    {DAY_LABELS[day]}
                  </p>
                  {recipe ? (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-neutral-800 truncate">
                        {recipe.emoji} {recipe.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clearDay(day)
                        }}
                        aria-label={`Retirer la recette de ${DAY_LABELS[day]}`}
                        className="shrink-0 text-neutral-300 hover:text-red-500 text-sm px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-neutral-300">
                      {selectedRecipe ? 'Toucher pour assigner' : 'Aucune recette'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {shoppingList.length > 0 && (
            <div className="mt-8 card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-neutral-900">🛒 Liste de courses de la semaine</h3>
                <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">
                  {copied ? '✅ Copié' : 'Copier'}
                </button>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {shoppingList.map((name) => (
                  <li key={name} className="chip !cursor-default">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
