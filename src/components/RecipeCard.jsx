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
      className="card p-4 text-left w-full cursor-pointer hover:shadow-cardHover hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden>
          {recipe.emoji}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {recipe.antiGaspi && <span className="badge badge-zest whitespace-nowrap">{c.antiGaspi}</span>}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(recipe)
              }}
              aria-label={isFavorite ? c.removeFromFavorites : c.addToFavorites}
              className={`text-lg leading-none transition ${
                isFavorite ? 'text-red-500' : 'text-neutral-300 hover:text-red-400'
              }`}
            >
              {isFavorite ? '❤️' : '🤍'}
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
