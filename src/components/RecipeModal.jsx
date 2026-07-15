import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { copyTextToClipboard } from '../utils/shoppingList.js'
import { localizeRecipeName, localizeRecipeSteps } from '../data/recipesDB.js'
import { extractCountryFlag } from '../utils/flag.js'
import { scaleIngredientQuantity } from '../utils/servings.js'
import { BASE_SERVINGS } from '../data/ingredientQuantities.js'

const MIN_SERVINGS = 1
const MAX_SERVINGS = 12

// Modale plein détail d'une recette : ingrédients, étapes numérotées.
// `isFavorite` / `onUpdateFavoriteMeta` sont optionnels : seule la page
// Favoris les fournit, pour afficher la note personnelle + la note en
// étoiles (voir AppContext.updateFavoriteMeta). Les autres appelants
// (résultats, page ingrédient) n'en ont pas besoin et n'affichent donc rien
// de plus.
export default function RecipeModal({ recipe, onClose, isFavorite, onUpdateFavoriteMeta }) {
  const { goToIngredient } = useApp()
  const lang = useLanguage()
  const c = COMMON[lang].recipe
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [note, setNote] = useState(recipe?.note || '')
  // État local séparé du prop `recipe` : le parent (FavoritesPage) garde une
  // référence figée à la recette ouverte dans `activeRecipe` et ne la
  // resynchronise pas après un `SET_FAVORITES`, donc relire `recipe.rating`
  // directement afficherait une note obsolète après un clic dans la modale.
  const [rating, setRating] = useState(recipe?.rating || 0)
  const [servings, setServings] = useState(BASE_SERVINGS)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!recipe) return null

  const allIngredients = [...new Set([...recipe.required, ...recipe.optional])]
  const missing = recipe.missingIngredients || []

  // Même extraction de drapeau que sur RecipeCard, pour une identité
  // visuelle cohérente entre la grille et le détail.
  const displayName = localizeRecipeName(recipe, lang)
  const { flag, cleanName } = extractCountryFlag(displayName)

  function handleIngredientClick(ing) {
    onClose()
    goToIngredient(ing)
  }

  async function handleCopyList() {
    const ok = await copyTextToClipboard(missing.join('\n'))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleShare() {
    const name = localizeRecipeName(recipe, lang)
    const shareText = `${name} ${recipe.emoji} — ${recipe.time} min`
    const url = window.location.origin
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: shareText, url })
      } catch {
        // Partage annulé par l'utilisateur ou échec silencieux : rien à faire,
        // on ne bascule pas sur le presse-papiers dans ce cas (ce serait
        // surprenant après une annulation volontaire).
      }
      return
    }
    const ok = await copyTextToClipboard(`${shareText}\n${url}`)
    if (ok) {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  function handleNoteBlur() {
    onUpdateFavoriteMeta?.(recipe.favId, { note })
  }

  function handleRatingClick(value) {
    // Cliquer sur l'étoile déjà sélectionnée en dernier retire la note
    // (bascule à 0), pour permettre de "dénoter" une recette facilement.
    const nextRating = rating === value ? 0 : value
    setRating(nextRating)
    onUpdateFavoriteMeta?.(recipe.favId, { rating: nextRating })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-xl2 rounded-t-xl2 max-h-[90vh] overflow-y-auto animate-popIn"
      >
        <div className="sticky top-0 bg-white flex items-start justify-between p-5 border-b border-neutral-100">
          <div>
            {/* Même tuile colorée que sur les cartes recette (RecipeCard), pour
                garder une identité visuelle cohérente entre la grille et le détail.
                Le drapeau pays (recettes du monde) est épinglé sur le coin. */}
            <div className="relative inline-block">
              <div
                className={`icon-badge ${recipe.antiGaspi ? 'bg-zest-50' : 'bg-fresh-50'}`}
                aria-hidden
              >
                {recipe.emoji}
              </div>
              {flag && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white ring-1 ring-black/5 shadow-card flex items-center justify-center text-[11px] leading-none"
                  aria-hidden
                >
                  {flag}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mt-2">{cleanName}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <span className="badge badge-neutral">⏱ {recipe.time} min</span>
              <span className="badge badge-neutral">{c.level[recipe.level] || recipe.level}</span>
              <span className="badge badge-neutral capitalize">{c.cuisine[recipe.cuisine] || recipe.cuisine}</span>
              {recipe.antiGaspi && <span className="badge badge-zest">{c.antiGaspi}</span>}
            </div>
          </div>
          <div className="flex items-start gap-1 shrink-0">
            <button onClick={handleShare} className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap">
              {shared ? c.copied : c.share}
            </button>
            <button
              onClick={onClose}
              aria-label={c.close}
              className="text-neutral-400 hover:text-neutral-900 text-xl leading-none px-1"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {isFavorite && onUpdateFavoriteMeta && (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl2 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm mb-1.5">{c.ratingLabel}</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const filled = value <= rating
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRatingClick(value)}
                        aria-label={`${value} / 5`}
                        className="p-0.5"
                      >
                        <Star
                          size={20}
                          className={filled ? 'fill-zest-400 text-zest-400' : 'text-neutral-300'}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm mb-1.5">{c.noteLabel}</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleNoteBlur}
                  placeholder={c.notePlaceholder}
                  rows={3}
                  className="w-full text-sm rounded-lg border border-neutral-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-fresh-300 resize-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="font-semibold text-neutral-900">{c.ingredients}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(MIN_SERVINGS, s - 1))}
                  disabled={servings <= MIN_SERVINGS}
                  aria-label={c.decreaseServings}
                  className="w-7 h-7 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  −
                </button>
                <span className="text-sm text-neutral-700 tabular-nums min-w-[6rem] text-center">
                  {servings} {c.servingsUnit(servings)}
                </span>
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
                  disabled={servings >= MAX_SERVINGS}
                  aria-label={c.increaseServings}
                  className="w-7 h-7 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
            </div>
            <ul className="space-y-1 text-sm">
              {allIngredients.map((ing) => {
                const isMatched = recipe.matchedIngredients?.includes(ing)
                const isMissing = recipe.missingIngredients?.includes(ing)
                const qty = scaleIngredientQuantity(ing, servings)
                return (
                  <li key={ing} className="flex items-center gap-2">
                    <span aria-hidden>{isMissing ? '🛒' : '✅'}</span>
                    {qty && (
                      <span className="text-neutral-400 tabular-nums text-xs shrink-0 w-16">{qty}</span>
                    )}
                    <button
                      onClick={() => handleIngredientClick(ing)}
                      className={`text-left underline decoration-dotted underline-offset-2 hover:text-fresh-700 ${
                        isMissing ? 'text-neutral-500' : 'text-neutral-800'
                      }`}
                    >
                      {ing}
                    </button>
                    {isMissing && <em className="text-xs text-zest-600">({c.toBuyParens})</em>}
                    {!isMissing && !isMatched && <em className="text-xs text-neutral-400"> ({c.optional})</em>}
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-neutral-400 mt-2">{c.quantitiesNote}</p>
          </div>

          {missing.length > 0 && (
            <div className="bg-zest-50 border border-zest-200 rounded-xl2 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-neutral-900 text-sm">{c.shoppingList}</h3>
                <button onClick={handleCopyList} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">
                  {copied ? c.copied : c.copy}
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-1.5">{missing.join(', ')}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-neutral-900 mb-2">{c.steps}</h3>
            <ol className="space-y-3">
              {localizeRecipeSteps(recipe, lang).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-700">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-fresh-100 text-fresh-700 font-semibold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
