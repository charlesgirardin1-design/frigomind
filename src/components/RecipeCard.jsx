import { useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { localizeRecipeName } from '../data/recipesDB.js'

const LEVEL_STYLES = {
  facile: 'badge-fresh',
  moyen: 'badge-neutral',
}

// Carte compacte pour une recette, cliquable pour voir le détail complet.
// `onOpen` reçoit la recette entière (pas juste son id) : les recettes
// génériques réutilisent le même id d'une session à l'autre, donc seul
// l'objet complet permet de retrouver la bonne recette de façon fiable
// (favoris...).
export default function RecipeCard({ recipe, onOpen, isFavorite, onToggleFavorite }) {
  const lang = useLanguage()
  const c = COMMON[lang].recipe
  // Compteur incrémenté à chaque clic sur le cœur : changer la `key` force React
  // à remonter le <span>, ce qui relance l'animation CSS à chaque clic (y compris
  // pour retirer un favori), sans dépendre d'un setTimeout à annuler.
  const [popTrigger, setPopTrigger] = useState(0)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(recipe)
        }
      }}
      className="group card p-4 text-left w-full cursor-pointer hover:shadow-cardHover hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start justify-between gap-2">
        {/* Emoji dans une tuile colorée (comme les icon-badge de l'accueil)
            plutôt qu'un emoji flottant seul, pour donner plus de présence
            visuelle à chaque carte. */}
        <div
          className={`icon-badge transition-transform duration-200 group-hover:scale-110 ${
            recipe.antiGaspi ? 'bg-zest-50' : 'bg-fresh-50'
          }`}
          aria-hidden
        >
          {recipe.emoji}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {recipe.antiGaspi && <span className="badge badge-zest whitespace-nowrap">{c.antiGaspi}</span>}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPopTrigger((n) => n + 1)
                onToggleFavorite(recipe)
              }}
              aria-label={isFavorite ? c.removeFromFavorites : c.addToFavorites}
              className={`text-lg leading-none transition ${
                isFavorite ? 'text-red-500' : 'text-neutral-300 hover:text-red-400'
              }`}
            >
              <span
                key={popTrigger}
                className={`inline-block ${popTrigger > 0 ? 'animate-heartPop' : ''}`}
              >
                {isFavorite ? '❤️' : '🤍'}
              </span>
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-2 font-semibold text-neutral-900 leading-snug">{localizeRecipeName(recipe, lang)}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="badge badge-neutral">⏱ {recipe.time} min</span>
        <span className={`badge ${LEVEL_STYLES[recipe.level] || 'badge-neutral'}`}>
          {c.level[recipe.level] || recipe.level}
        </span>
        <span className="badge badge-neutral capitalize">{c.cuisine[recipe.cuisine] || recipe.cuisine}</span>
      </div>

      {recipe.missingIngredients?.length > 0 && (
        <p className="mt-2 text-xs text-neutral-400">
          {c.toBuy} : {recipe.missingIngredients.join(', ')}
        </p>
      )}

      <p className="mt-3 text-xs font-medium text-fresh-600">{c.seeRecipe}</p>
    </div>
  )
}
