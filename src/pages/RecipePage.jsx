import { useState } from 'react'
import { Star } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { copyTextToClipboard } from '../utils/shoppingList.js'
import { localizeRecipeName, localizeRecipeSteps } from '../data/recipesDB.js'
import { extractCountryFlag } from '../utils/flag.js'
import { scaleIngredientQuantity } from '../utils/servings.js'
import { getSubstitutes, findAvailableSubstitute } from '../data/ingredientSubstitutes.js'
import { getFavoriteKey } from '../utils/storage.js'
import { estimateRecipeCalories } from '../utils/calories.js'
import { getRecipeIntro, getRecipeTip } from '../utils/recipeVoice.js'
import CookingMode from '../components/CookingMode.jsx'

const MIN_SERVINGS = 1
const MAX_SERVINGS = 12
const SERVINGS_PRESETS = [2, 4, 6, 8]

// Page plein écran d'une recette (ingrédients, quantités, étapes) — ouverte
// depuis n'importe quelle liste (résultats, favoris, page ingrédient...) via
// AppContext.openRecipe, qui mémorise la vue d'origine pour le bouton retour.
// La note personnelle + note en étoiles ne s'affichent que si la recette est
// dans les favoris (recherche par clé, voir getFavoriteKey), pour rester
// disponibles même en ouvrant une recette pas encore favorisée depuis les
// résultats plutôt que depuis la page Favoris elle-même.
export default function RecipePage() {
  const { state, goTo, goToIngredient, updateFavoriteMeta } = useApp()
  const lang = useLanguage()
  const c = COMMON[lang].recipe
  const recipe = state.viewingRecipe

  const favMatch = recipe ? state.favorites.find((f) => getFavoriteKey(f) === getFavoriteKey(recipe)) : null
  const isFavorite = !!favMatch

  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [note, setNote] = useState(favMatch?.note || '')
  const [rating, setRating] = useState(favMatch?.rating || 0)
  // Démarre à 1 personne (pas la base de calcul à 4 personnes des quantités,
  // voir ingredientQuantities.js) : l'utilisateur ajuste lui-même ensuite.
  const [servings, setServings] = useState(MIN_SERVINGS)
  const [cookingMode, setCookingMode] = useState(false)

  if (!recipe) {
    goTo('home')
    return null
  }

  const allIngredients = [...new Set([...recipe.required, ...recipe.optional])]
  const missing = recipe.missingIngredients || []
  const missingWithQty = missing.map((ing) => ({ ing, qty: scaleIngredientQuantity(ing, servings) }))
  // Ce que l'utilisateur a réellement indiqué avoir (session en cours) : sert
  // au moteur de substitution dynamique ci-dessous pour proposer un
  // remplacement concret plutôt qu'une suggestion générique (voir
  // findAvailableSubstitute). Vide si la recette est ouverte depuis les
  // favoris/l'historique sans détection en cours — on retombe alors sur la
  // suggestion générique, jamais sur une liste périmée d'une autre session.
  const availableIngredientNames = state.ingredients.filter((i) => i.checked).map((i) => i.name)
  const totalCalories = estimateRecipeCalories(allIngredients, servings)
  const caloriesPerServing = totalCalories ? Math.round(totalCalories / servings / 10) * 10 : null

  const displayName = localizeRecipeName(recipe, lang)
  const { flag, cleanName } = extractCountryFlag(displayName)
  const cuisineLabel = c.cuisine[recipe.cuisine] || recipe.cuisine
  const levelLabel = c.level[recipe.level] || recipe.level
  const intro = getRecipeIntro(recipe, lang, cuisineLabel, levelLabel)
  const tip = getRecipeTip(recipe, lang)

  function handleBack() {
    goTo(state.recipeReturnView || 'home')
  }

  function handleIngredientClick(ing) {
    goToIngredient(ing)
  }

  async function handleCopyList() {
    const text = missingWithQty.map(({ ing, qty }) => (qty ? `${ing} (${qty})` : ing)).join('\n')
    const ok = await copyTextToClipboard(text)
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
    if (favMatch) updateFavoriteMeta(favMatch.favId, { note })
  }

  function handleRatingClick(value) {
    // Cliquer sur l'étoile déjà sélectionnée en dernier retire la note
    // (bascule à 0), pour permettre de "dénoter" une recette facilement.
    const nextRating = rating === value ? 0 : value
    setRating(nextRating)
    if (favMatch) updateFavoriteMeta(favMatch.favId, { rating: nextRating })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={handleBack} className="print:hidden text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        {COMMON[lang].back}
      </button>

      <div className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            {/* Même tuile colorée que sur les cartes recette (RecipeCard), pour
                garder une identité visuelle cohérente entre la grille et le détail.
                Le drapeau pays (recettes du monde) est épinglé sur le coin. */}
            <div className="relative inline-block">
              <div
                className={`icon-badge !w-16 !h-16 !text-3xl ${recipe.antiGaspi ? 'bg-zest-50' : 'bg-fresh-50'}`}
                aria-hidden
              >
                {recipe.emoji}
              </div>
              {flag && (
                <span
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white ring-1 ring-black/5 shadow-card flex items-center justify-center text-sm leading-none"
                  aria-hidden
                >
                  {flag}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-3 leading-tight">{cleanName}</h1>
            {intro && (
              <p className="mt-2 text-neutral-600 text-[15px] leading-relaxed max-w-lg">{intro}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {recipe.diet?.map((tag) => c.dietLabels[tag] && (
                <span key={tag} className="badge badge-fresh">{c.dietLabels[tag]}</span>
              ))}
              <span className="badge badge-neutral">⏱ {recipe.time} min</span>
              <span className="badge badge-neutral">{levelLabel}</span>
              <span className="badge badge-neutral capitalize">{cuisineLabel}</span>
              {caloriesPerServing && (
                <span className="badge badge-neutral">🔥 {c.caloriesPerServing(caloriesPerServing)}</span>
              )}
              {recipe.antiGaspi && <span className="badge badge-zest">{c.antiGaspi}</span>}
              {recipe.flavorPairing && <span className="badge badge-fresh">{c.flavorPairingBadge}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              onClick={() => {
                // "Débloque" la synthèse vocale sur Safari/iOS, qui exige un
                // premier appel speak() synchrone dans le geste utilisateur —
                // sans ça, la toute première lecture d'étape (qui démarre un
                // instant plus tard, une fois CookingMode monté) resterait
                // muette sur ces navigateurs.
                window.speechSynthesis?.speak(new window.SpeechSynthesisUtterance(''))
                setCookingMode(true)
              }}
              className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap"
            >
              {c.handsFreeMode}
            </button>
            <button onClick={() => window.print()} className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap">
              {c.print}
            </button>
            <button onClick={handleShare} className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap">
              {shared ? c.copied : c.share}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {recipe.flavorPairing && (
            <div className="bg-fresh-50 border border-fresh-100 rounded-xl2 p-4">
              <h3 className="font-semibold text-neutral-900 text-sm mb-1">{c.whyItWorks}</h3>
              <p className="text-sm text-neutral-600">{lang === 'en' ? recipe.pairingWhyEn : recipe.pairingWhy}</p>
            </div>
          )}

          {isFavorite && (
            <div className="print:hidden bg-neutral-50 border border-neutral-100 rounded-xl2 p-4 space-y-3">
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
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-neutral-900">{c.ingredients}</h3>
              {/* w-full en dessous de sm: force ce bloc à occuper toute la
                  largeur disponible une fois passé à la ligne (voir le
                  flex-wrap du parent) — sans ça, un conteneur flex sans
                  largeur contrainte se dimensionne à son contenu total et
                  déborderait de la carte plutôt que de faire réellement
                  passer ses boutons à la ligne sur petit écran. */}
              <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
                <div className="print:hidden flex items-center gap-1">
                  {SERVINGS_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setServings(n)}
                      aria-label={`${n} ${c.servingsUnit(n)}`}
                      aria-pressed={servings === n}
                      className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border transition-colors ${
                        servings === n
                          ? 'bg-fresh-700 border-fresh-700 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="print:hidden w-px h-5 bg-neutral-200 mx-0.5" aria-hidden />
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(MIN_SERVINGS, s - 1))}
                  disabled={servings <= MIN_SERVINGS}
                  aria-label={c.decreaseServings}
                  className="print:hidden w-7 h-7 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  −
                </button>
                <span className="text-sm text-neutral-700 tabular-nums min-w-[5.5rem] text-center">
                  {servings} {c.servingsUnit(servings)}
                </span>
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
                  disabled={servings >= MAX_SERVINGS}
                  aria-label={c.increaseServings}
                  className="print:hidden w-7 h-7 rounded-full border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
            </div>
            {(() => {
              // `recipe.unusedIngredients` (voir recipeEngine.js) liste des
              // ingrédients validés par l'utilisateur qui, par définition, ne
              // font PAS partie de `recipe.required`/`optional` — les recettes
              // de la base ou les mariages de saveurs n'y ajoutent jamais un
              // ingrédient hors sujet. `allIngredients` (utilisé aussi pour le
              // calcul des calories, à ne pas fausser en y mêlant des
              // ingrédients qui n'entrent pas dans le plat) ne les contient
              // donc jamais : on les ajoute ici, seulement pour l'affichage.
              const displayIngredients = [...new Set([...allIngredients, ...(recipe.unusedIngredients || [])])]
              const unusedIngredients = displayIngredients.filter((ing) => recipe.unusedIngredients?.includes(ing))
              const usedIngredients = displayIngredients.filter((ing) => !recipe.unusedIngredients?.includes(ing))

              function renderIngredient(ing) {
                // Un ingrédient est "optionnel" s'il fait partie de
                // `recipe.optional` (fait structurel de la recette), pas
                // simplement s'il n'a pas été "matché" lors d'un scan photo
                // — `recipe.matchedIngredients` n'existe que pour les
                // recettes ouvertes depuis un résultat de scan ; en
                // provenance directe (page "Toutes les recettes", favoris
                // anciens...) il est absent, ce qui étiquetait à tort TOUS
                // les ingrédients comme optionnels, y compris les requis.
                const isRequired = recipe.required?.includes(ing)
                const isMissing = recipe.missingIngredients?.includes(ing)
                const isUnused = recipe.unusedIngredients?.includes(ing)
                const qty = scaleIngredientQuantity(ing, servings)
                const substitutes = isMissing ? getSubstitutes(ing) : null
                const dynamicSub = isMissing ? findAvailableSubstitute(ing, availableIngredientNames) : null
                const dynamicSubQty = dynamicSub ? scaleIngredientQuantity(dynamicSub, servings) : null
                return (
                  <li key={ing}>
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{isMissing ? '🛒' : isUnused ? '➖' : '✅'}</span>
                      {qty && (
                        <span className="text-neutral-500 tabular-nums text-xs shrink-0">{qty}</span>
                      )}
                      <button
                        onClick={() => handleIngredientClick(ing)}
                        className={`text-left underline decoration-dotted underline-offset-2 hover:text-fresh-700 ${
                          isMissing || isUnused ? 'text-neutral-500' : 'text-neutral-800'
                        }`}
                      >
                        {ing}
                      </button>
                      {isMissing && <em className="text-xs text-zest-700">({c.toBuyParens})</em>}
                      {isUnused && !isMissing && <em className="text-xs text-neutral-400">({c.notUsedHere})</em>}
                      {!isMissing && !isUnused && !isRequired && <em className="text-xs text-neutral-500"> ({c.optional})</em>}
                    </div>
                    {dynamicSub ? (
                      <p className="text-xs text-fresh-700 dark:text-fresh-400 font-medium mt-0.5 ml-6">
                        {c.dynamicSubstitute(ing, dynamicSubQty ? `${dynamicSubQty} ${dynamicSub}` : dynamicSub)}
                      </p>
                    ) : (
                      substitutes && (
                        <p className="text-xs text-neutral-500 mt-0.5 ml-6">
                          {c.substituteWith} {substitutes.join(', ')}
                        </p>
                      )
                    )}
                  </li>
                )
              }

              return (
                <>
                  {unusedIngredients.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                        {c.ingredientsNotUsed}
                      </h4>
                      <ul className="space-y-2 text-sm">{unusedIngredients.map(renderIngredient)}</ul>
                    </div>
                  )}
                  {unusedIngredients.length > 0 && (
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                      {c.ingredientsUsed}
                    </h4>
                  )}
                  <ul className="space-y-2 text-sm">{usedIngredients.map(renderIngredient)}</ul>
                </>
              )
            })()}
            <p className="text-xs text-neutral-500 mt-2">{c.quantitiesNote}</p>
          </div>

          {missing.length > 0 && (
            <div className="bg-zest-50 border border-zest-200 rounded-xl2 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-neutral-900 text-sm">{c.shoppingList}</h3>
                <button onClick={handleCopyList} className="print:hidden btn-secondary !py-1.5 !px-3 text-xs shrink-0">
                  {copied ? c.copied : c.copy}
                </button>
              </div>
              <ul className="text-sm text-neutral-600 mt-1.5 space-y-1">
                {missingWithQty.map(({ ing, qty }) => (
                  <li key={ing}>
                    {ing}
                    {qty && <span className="text-neutral-400"> — {qty}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">{c.steps}</h3>
            {/* Étapes présentées comme un vrai fil de préparation plutôt
                qu'une liste technique : trait vertical continu entre les
                numéros (via la bordure du conteneur + un décalage négatif),
                texte plus grand et plus aéré pour une lecture posée. */}
            <ol className="relative border-l-2 border-fresh-100 dark:border-fresh-900/40 space-y-6 ml-3.5">
              {localizeRecipeSteps(recipe, lang).map((step, i) => (
                <li key={i} className="relative pl-6">
                  <span className="absolute -left-[15px] top-0 w-7 h-7 rounded-full bg-fresh-600 text-white font-semibold text-xs flex items-center justify-center ring-4 ring-white dark:ring-neutral-900">
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-neutral-700">{step}</p>
                </li>
              ))}
            </ol>
            {tip && (
              <div className="mt-6 bg-zest-50 dark:bg-zest-900/20 border border-zest-100 dark:border-zest-900/40 rounded-xl2 p-4">
                <h4 className="font-semibold text-zest-800 dark:text-zest-400 text-sm mb-1">{c.chefTip}</h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{tip}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {cookingMode && (
        <CookingMode recipe={recipe} servings={servings} lang={lang} onClose={() => setCookingMode(false)} />
      )}
    </div>
  )
}
