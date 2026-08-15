import { useState } from 'react'
import { Star } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { copyTextToClipboard } from '../utils/shoppingList.js'
import { localizeRecipeName, localizeRecipeSteps } from '../data/recipesDB.js'
import { extractCountryFlag } from '../utils/flag.js'
import {
  scaleIngredientQuantity,
  scaleStepText,
  getIngredientDisplayName,
  getRequiredPieceCount,
  getRequiredWeightGrams,
} from '../utils/servings.js'
import { BASE_SERVINGS, INGREDIENT_QUANTITIES } from '../data/ingredientQuantities.js'
import { getSubstitutes, findAvailableSubstitute } from '../data/ingredientSubstitutes.js'
import { ingredientsMatch } from '../logic/recipeEngine.js'
import { getFavoriteKey } from '../utils/storage.js'
import { estimateRecipeCalories } from '../utils/calories.js'
import { getRecipeIntro, getRecipeTip } from '../utils/recipeVoice.js'
import { translateIngredientName } from '../data/ingredientTranslations.js'
import { getPluralForm } from '../data/ingredientPlurals.js'

const MIN_SERVINGS = 1
const MAX_SERVINGS = 12
const SERVINGS_PRESETS = [2, 4, 6, 8]

// Nombre d'unités/poids RÉELLEMENT scanné ou déclaré pour `ing`, en
// additionnant tout ingrédient coché dont le nom correspond au sens large
// (ingredientsMatch — même règle que le reste de la page, voir
// sumScannedCount/sumScannedWeight plus bas). `unit` détermine le champ lu :
// "pièce(s)" -> `count`, sinon -> `weightGrams` (grammes, ml compris).
function sumCheckedAmount(checkedIngredients, ing, unit) {
  let total = 0
  let found = false
  for (const item of checkedIngredients) {
    const raw = unit === 'pièce(s)' ? item.count : item.weightGrams
    if (!Number.isFinite(raw) || !ingredientsMatch(item.name, ing)) continue
    total += raw
    found = true
  }
  return found ? total : undefined
}

// Suggère un nombre de personnes de DÉPART cohérent avec ce qui a
// réellement été scanné, au lieu de toujours démarrer à BASE_SERVINGS —
// signalé : pour une seule pêche photographiée, la fiche recette affichait
// d'emblée du miel/des amandes en quantité pour 4 personnes, sans rapport
// avec la quantité réelle. Pour chaque ingrédient REQUIS de la recette dont
// on connaît la quantité scannée, calcule le nombre de personnes qui
// correspondrait exactement à cette quantité, puis retient le plus PETIT de
// ces nombres (l'ingrédient le plus rare doit dimensionner la recette, pas
// le plus abondant — sinon on suggérerait un nombre de personnes que
// l'ingrédient le plus rare ne pourrait pas suivre). Retombe sur
// BASE_SERVINGS si rien n'a été scanné (favoris, historique, "Toutes les
// recettes"...) : comportement inchangé dans ce cas.
function suggestInitialServings(recipe, checkedIngredients) {
  if (!recipe || checkedIngredients.length === 0) return BASE_SERVINGS
  const idealServingsPerAnchor = recipe.required
    .map((ing) => {
      const base = INGREDIENT_QUANTITIES[ing]
      if (!base) return null
      const have = sumCheckedAmount(checkedIngredients, ing, base.unit)
      if (have === undefined || have <= 0) return null
      return (BASE_SERVINGS * have) / base.amount
    })
    .filter((n) => Number.isFinite(n) && n > 0)
  if (idealServingsPerAnchor.length === 0) return BASE_SERVINGS
  const suggested = Math.round(Math.min(...idealServingsPerAnchor))
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, suggested))
}

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

  // Ingrédients cochés (issus du scan ou ajoutés à la main) — utilisé à la
  // fois pour suggérer un nombre de personnes de départ cohérent avec ce qui
  // a vraiment été scanné (voir suggestInitialServings ci-dessous) et, plus
  // bas, pour le calcul de quantité insuffisante (sumScannedCount/Weight).
  const checkedIngredients = state.ingredients.filter((i) => i.checked)

  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [note, setNote] = useState(favMatch?.note || '')
  const [rating, setRating] = useState(favMatch?.rating || 0)
  // Démarre à BASE_SERVINGS (4 personnes) par défaut — SAUF si un ingrédient
  // principal de la recette a été réellement scanné en quantité connue (ex:
  // 1 pêche détectée sur la photo), auquel cas on démarre plutôt au nombre
  // de personnes cohérent avec CETTE quantité (ex: 1), pour ne pas afficher
  // d'emblée des proportions pensées pour 4 personnes (miel, amandes...) sur
  // un seul fruit — signalé : "1 pêche photographiée, mais 4 c. à soupe de
  // miel et 50 g d'amandes suggérés". Reste purement une suggestion de
  // DÉPART : l'utilisateur garde le sélecteur pour l'ajuster à tout moment,
  // et les étapes détaillées (écrites pour BASE_SERVINGS, voir
  // scripts/detail-recipe-steps.mjs) se recalculent déjà dynamiquement pour
  // n'importe quelle valeur (scaleStepText), pas seulement BASE_SERVINGS.
  const [servings, setServings] = useState(() => suggestInitialServings(recipe, checkedIngredients))

  if (!recipe) {
    goTo('home')
    return null
  }

  const allIngredients = [...new Set([...recipe.required, ...recipe.optional])]
  const missing = recipe.missingIngredients || []
  const missingWithQty = missing.map((ing) => ({ ing, qty: scaleIngredientQuantity(ing, servings, lang) }))
  // Ce que l'utilisateur a réellement indiqué avoir (session en cours) : sert
  // au moteur de substitution dynamique ci-dessous pour proposer un
  // remplacement concret plutôt qu'une suggestion générique (voir
  // findAvailableSubstitute). Vide si la recette est ouverte depuis les
  // favoris/l'historique sans détection en cours — on retombe alors sur la
  // suggestion générique, jamais sur une liste périmée d'une autre session.
  const availableIngredientNames = state.ingredients.filter((i) => i.checked).map((i) => i.name)
  // Nombre d'unités RÉELLEMENT scanné/déclaré pour un ingrédient requis par
  // la recette (ex: "5" pour 5 tomates détectées à la photo) — voir
  // mockVision.js. Additionne TOUS les ingrédients cochés dont le nom
  // correspond à `ing` au sens large (ingredientsMatch, la même règle que
  // celle qui décide si l'ingrédient est "utilisé" dans la recette) : un
  // "poivron rouge" et un "poivron vert" scannés séparément comptent tous
  // les deux pour un "poivron" requis générique, sans quoi une recette
  // demandant 3 poivrons semblait satisfaite alors qu'il n'y en avait que 2
  // au total. `undefined` (pas juste 0) si rien ne correspond : la recette
  // est peut-être ouverte depuis les favoris/l'historique (pas de scan en
  // cours), ce qui désactive naturellement la comparaison ci-dessous plutôt
  // que de comparer à une quantité périmée d'une autre session.
  function sumScannedCount(ing) {
    let total = 0
    let found = false
    for (const item of checkedIngredients) {
      if (!Number.isFinite(item.count) || !ingredientsMatch(item.name, ing)) continue
      total += item.count
      found = true
    }
    return found ? total : undefined
  }
  // Même principe pour le poids/volume (grammes, ml compris) — uniquement
  // quand lisible sur un emballage (voir api/analyze-fridge.js) : la plupart
  // des ingrédients pesés n'en auront jamais (viande à la coupe, riz en
  // vrac...), ce qui désactive naturellement la comparaison pour eux plutôt
  // que d'inventer un chiffre.
  function sumScannedWeight(ing) {
    let total = 0
    let found = false
    for (const item of checkedIngredients) {
      if (!Number.isFinite(item.weightGrams) || !ingredientsMatch(item.name, ing)) continue
      total += item.weightGrams
      found = true
    }
    return found ? total : undefined
  }
  // Un ingrédient "utilisé" (scanné, présent dans la recette) peut quand même
  // ne pas suffire en quantité pour le nombre de personnes choisi (ex: 5
  // tomates scannées, 7 nécessaires pour 7 personnes ; ou 300 g de viande
  // hachée lus sur l'emballage, 500 g nécessaires). Renvoie `null` (pas de
  // vérification possible, ou quantité suffisante) ou `{ amount, unit }` (le
  // complément manquant) — jamais un simple booléen, l'affichage a besoin de
  // savoir QUOI afficher (bare number pour "pièce(s)", "150 g" pour un poids).
  function getShortfall(ing) {
    const base = INGREDIENT_QUANTITIES[ing]
    if (!base) return null
    if (base.unit === 'pièce(s)') {
      const have = sumScannedCount(ing)
      if (have === undefined) return null
      const needed = getRequiredPieceCount(ing, servings)
      if (needed === null) return null
      const amount = needed - have
      return amount > 0 ? { amount, unit: 'pièce(s)' } : null
    }
    if (base.unit === 'g' || base.unit === 'ml') {
      const have = sumScannedWeight(ing)
      if (have === undefined) return null
      const needed = getRequiredWeightGrams(ing, servings)
      if (needed === null) return null
      const amount = needed - have
      return amount > 0 ? { amount, unit: base.unit } : null
    }
    return null
  }
  // Ingrédients "utilisés" (ni manquants, ni non-utilisés) mais en quantité
  // insuffisante — rejoint la liste de courses au même titre que les
  // ingrédients entièrement manquants (voir shoppingList ci-dessous), avec
  // le complément à acheter plutôt que la quantité totale de la recette.
  const shortfallWithQty = allIngredients
    .filter((ing) => !missing.includes(ing) && !recipe.unusedIngredients?.includes(ing))
    .map((ing) => ({ ing, shortfall: getShortfall(ing) }))
    .filter(({ shortfall }) => shortfall !== null)
  // Étiquette lisible du complément manquant : bare number pour "pièce(s)"
  // (accordé plus bas sur le nom, ex: "2 tomates"), "150 g"/"0,3 L" pour un
  // poids/volume (arrondi au gramme/ml — la différence de deux valeurs déjà
  // arrondies par ailleurs tombe presque toujours sur un chiffre rond).
  function formatShortfallAmount({ amount, unit }) {
    if (unit === 'pièce(s)') {
      return Number.isInteger(amount) ? String(amount) : (lang === 'en' ? amount.toFixed(1) : amount.toFixed(1).replace('.', ','))
    }
    return `${Math.round(amount)} ${unit}`
  }
  // Nom accordé sur le COMPLÉMENT à acheter (ex: "2 tomates de plus"), pas
  // sur la quantité totale de la recette (getIngredientDisplayName, qui
  // s'accorde sur `servings`) — un shortfall de 1 doit rester singulier même
  // si la recette entière demande 7 tomates. Les ingrédients pesés (jamais de
  // forme plurielle propre, ex: "viande hachée") retombent simplement sur la
  // traduction brute.
  function shortfallDisplayName(ing, shortfall) {
    if (shortfall.unit !== 'pièce(s)') return translateIngredientName(ing, lang)
    return getPluralForm(ing, shortfall.amount, lang) || translateIngredientName(ing, lang)
  }
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
    const missingLines = missingWithQty.map(({ ing, qty }) => {
      const label = getIngredientDisplayName(ing, servings, lang)
      return qty ? `${label} (${qty})` : label
    })
    const shortfallLines = shortfallWithQty.map(({ ing, shortfall }) => {
      const label = shortfallDisplayName(ing, shortfall)
      return `${label} (${c.shortfallQty(formatShortfallAmount(shortfall))})`
    })
    const text = [...missingLines, ...shortfallLines].join('\n')
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
              const usedIngredients = displayIngredients.filter(
                (ing) => !recipe.unusedIngredients?.includes(ing) && !recipe.missingIngredients?.includes(ing)
              )
              const toBuyIngredients = displayIngredients.filter((ing) => recipe.missingIngredients?.includes(ing))

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
                const shortfall = !isMissing && !isUnused ? getShortfall(ing) : null
                const qty = scaleIngredientQuantity(ing, servings, lang)
                const substitutes = isMissing ? getSubstitutes(ing) : null
                const dynamicSub = isMissing ? findAvailableSubstitute(ing, availableIngredientNames) : null
                const dynamicSubQty = dynamicSub ? scaleIngredientQuantity(dynamicSub, servings, lang) : null
                const ingLabel = getIngredientDisplayName(ing, servings, lang)
                return (
                  <li key={ing}>
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{isMissing ? '🛒' : isUnused ? '➖' : shortfall ? '⚠️' : '✅'}</span>
                      {qty && !isUnused && (
                        <span className="text-neutral-500 tabular-nums text-xs shrink-0">{qty}</span>
                      )}
                      <button
                        onClick={() => handleIngredientClick(ing)}
                        className={`text-left underline decoration-dotted underline-offset-2 hover:text-fresh-700 ${
                          isMissing || isUnused ? 'text-neutral-500' : 'text-neutral-800'
                        }`}
                      >
                        {ingLabel}
                      </button>
                      {isMissing && (
                        <em className="text-xs text-zest-700">
                          ({c.toBuyParens}{!isRequired ? `, ${c.optional}` : ''})
                        </em>
                      )}
                      {/* Quantité scannée insuffisante pour ce nombre de
                          personnes (voir getShortfall ci-dessus) : jamais en
                          même temps que isMissing (l'ingrédient est alors
                          entièrement absent, pas juste insuffisant). */}
                      {shortfall && <em className="text-xs text-zest-700">({c.shortfallParens(formatShortfallAmount(shortfall))})</em>}
                      {isUnused && !isMissing && <em className="text-xs text-neutral-400">({c.notUsedHere})</em>}
                      {!isMissing && !isUnused && !isRequired && <em className="text-xs text-neutral-500"> ({c.optional})</em>}
                    </div>
                    {dynamicSub ? (
                      <p className="text-xs text-fresh-700 dark:text-fresh-400 font-medium mt-0.5 ml-6">
                        {c.dynamicSubstitute(
                          ingLabel,
                          dynamicSubQty
                            ? `${dynamicSubQty} ${getIngredientDisplayName(dynamicSub, servings, lang)}`
                            : getIngredientDisplayName(dynamicSub, servings, lang)
                        )}
                      </p>
                    ) : (
                      substitutes && (
                        <p className="text-xs text-neutral-500 mt-0.5 ml-6">
                          {c.substituteWith} {substitutes.map((s) => translateIngredientName(s, lang)).join(', ')}
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
                  {(unusedIngredients.length > 0 || toBuyIngredients.length > 0) && usedIngredients.length > 0 && (
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                      {c.ingredientsUsed}
                    </h4>
                  )}
                  {usedIngredients.length > 0 && (
                    <ul className="space-y-2 text-sm mb-3">{usedIngredients.map(renderIngredient)}</ul>
                  )}
                  {toBuyIngredients.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zest-700 uppercase tracking-wide mb-1.5">
                        {c.toBuy}
                      </h4>
                      <ul className="space-y-2 text-sm">{toBuyIngredients.map(renderIngredient)}</ul>
                    </div>
                  )}
                </>
              )
            })()}
            <p className="text-xs text-neutral-500 mt-2">{c.quantitiesNote}</p>
          </div>

          {(missing.length > 0 || shortfallWithQty.length > 0) && (
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
                    {getIngredientDisplayName(ing, servings, lang)}
                    {qty && <span className="text-neutral-400"> — {qty}</span>}
                  </li>
                ))}
                {/* Ingrédients scannés mais en quantité insuffisante pour ce
                    nombre de personnes (voir shortfallWithQty) : le
                    complément à acheter, pas la quantité totale — distinct
                    des ingrédients entièrement absents ci-dessus. */}
                {shortfallWithQty.map(({ ing, shortfall }) => (
                  <li key={ing}>
                    {shortfallDisplayName(ing, shortfall)}
                    <span className="text-neutral-400"> — {c.shortfallQty(formatShortfallAmount(shortfall))}</span>
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
                texte plus grand et plus aéré pour une lecture posée. Les
                quantités écrites en dur dans le texte (voir
                scripts/detail-recipe-steps.mjs) sont réécrites à la volée
                pour rester cohérentes avec le nombre de personnes choisi
                ci-dessus (voir scaleStepText) — sans ça, la liste
                d'ingrédients et les étapes affichaient deux chiffres
                différents pour le même ingrédient dès que l'utilisateur
                changeait le nombre de personnes. */}
            <ol className="relative border-l-2 border-fresh-100 dark:border-fresh-900/40 space-y-6 ml-3.5">
              {localizeRecipeSteps(recipe, lang).map((step, i) => (
                <li key={i} className="relative pl-6">
                  <span className="absolute -left-[15px] top-0 w-7 h-7 rounded-full bg-fresh-600 text-white font-semibold text-xs flex items-center justify-center ring-4 ring-white dark:ring-neutral-900">
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-neutral-700">{scaleStepText(step, recipe, servings, lang)}</p>
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

    </div>
  )
}
