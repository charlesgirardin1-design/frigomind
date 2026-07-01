// -----------------------------------------------------------------------------
// recipeEngine.js
// "Cerveau" de la génération de recettes. Prend les ingrédients validés par
// l'utilisateur + ses préférences, et retourne 3 à 5 recettes réalistes.
//
// Principes IA voulus par le produit :
//  - privilégier les recettes qui utilisent le MAXIMUM d'ingrédients dispo
//  - ne jamais exiger d'ingrédients externes inutiles (les basiques type
//    sel/poivre/huile ne comptent jamais comme "manquants")
//  - ne jamais bloquer l'utilisateur : si aucune recette ne correspond
//    parfaitement, on retourne quand même les meilleures approximations
//  - favoriser l'anti-gaspi : bonus de score pour les recettes qui utilisent
//    des ingrédients périssables (à consommer vite)
// -----------------------------------------------------------------------------

import { RECIPES } from '../data/recipesDB.js'
import { isPantryStaple, isPerishable } from '../data/expiryData.js'

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents pour un matching plus tolerant
}

function includesIngredient(availableSet, ingredientName) {
  const target = normalize(ingredientName)
  for (const available of availableSet) {
    if (normalize(available) === target || normalize(available).includes(target) || target.includes(normalize(available))) {
      return true
    }
  }
  return false
}

/**
 * Calcule un score de correspondance pour une recette donnée.
 */
function scoreRecipe(recipe, availableIngredients) {
  const requiredMatched = recipe.required.filter((ing) => includesIngredient(availableIngredients, ing))
  const requiredMissing = recipe.required.filter((ing) => !includesIngredient(availableIngredients, ing) && !isPantryStaple(ing))
  const optionalMatched = recipe.optional.filter((ing) => includesIngredient(availableIngredients, ing))

  const requiredScore = recipe.required.length ? requiredMatched.length / recipe.required.length : 1
  const optionalBonus = recipe.optional.length ? (optionalMatched.length / recipe.optional.length) * 0.25 : 0

  // Bonus anti-gaspi : la recette utilise des ingrédients périssables présents
  const usesPerishable = [...recipe.required, ...recipe.optional].some(
    (ing) => includesIngredient(availableIngredients, ing) && isPerishable(ing)
  )
  const antiGaspiBonus = usesPerishable ? 0.15 : 0

  const score = requiredScore + optionalBonus + antiGaspiBonus

  return {
    score,
    requiredMatched,
    requiredMissing,
    optionalMatched,
    antiGaspi: usesPerishable,
  }
}

function applyPreferenceFilters(recipe, prefs) {
  if (prefs.maxTime && prefs.maxTime !== 'peu importe' && recipe.time > Number(prefs.maxTime)) {
    return false
  }
  if (prefs.cuisine && prefs.cuisine !== 'toutes' && recipe.cuisine !== prefs.cuisine) {
    return false
  }
  if (prefs.vegetarien && !recipe.diet.includes('vegetarien')) {
    return false
  }
  return true
}

/**
 * Génère entre 3 et 5 recettes à partir des ingrédients validés.
 * @param {string[]} validatedIngredients
 * @param {{maxTime?: string, cuisine?: string, vegetarien?: boolean}} prefs
 */
export function generateRecipes(validatedIngredients, prefs = {}) {
  const available = validatedIngredients.filter(Boolean)

  const scored = RECIPES.map((recipe) => ({
    recipe,
    ...scoreRecipe(recipe, available),
  }))

  // 1) on tente d'abord avec TOUS les filtres de préférences appliqués
  let candidates = scored.filter(({ recipe }) => applyPreferenceFilters(recipe, prefs))

  // 2) on ne garde que les recettes avec au maximum 1 ingrédient requis manquant
  //    (règle "réaliste niveau étudiant" : pas besoin de courir acheter 3 choses)
  let strong = candidates.filter((c) => c.requiredMissing.length <= 1 && c.score > 0)

  strong.sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)

  let results = strong.slice(0, 5)

  // Anti-blocage : si moins de 3 résultats, on complète avec les meilleures
  // recettes restantes même imparfaites (sans les filtres stricts), pour ne
  // JAMAIS laisser l'utilisateur sans suggestion.
  if (results.length < 3) {
    const usedIds = new Set(results.map((r) => r.recipe.id))
    const fallback = scored
      .filter((c) => !usedIds.has(c.recipe.id))
      .sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)
      .slice(0, 5 - results.length)
    results = [...results, ...fallback]
  }

  return results.map((r) => ({
    ...r.recipe,
    matchScore: Math.round(Math.min(r.score, 1.15) * 100),
    matchedIngredients: [...new Set([...r.requiredMatched, ...r.optionalMatched])],
    missingIngredients: r.requiredMissing,
    antiGaspi: r.antiGaspi,
  }))
}

/**
 * Bouton "J'ai faim → surprends-moi" : choisit une recette pondérée par son
 * score parmi les ingrédients disponibles, en ignorant les préférences.
 */
export function surpriseRecipe(validatedIngredients) {
  const all = generateRecipes(validatedIngredients, {})
  if (all.length === 0) return null
  // Tirage pondéré : plus le score est haut, plus la recette a de chances
  const weights = all.map((r) => Math.max(r.matchScore, 5))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < all.length; i += 1) {
    rand -= weights[i]
    if (rand <= 0) return all[i]
  }
  return all[0]
}
