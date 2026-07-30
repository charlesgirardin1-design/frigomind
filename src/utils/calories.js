// -----------------------------------------------------------------------------
// calories.js
// Estime les calories d'une recette à partir de ses ingrédients — même
// principe que scaleIngredientQuantity (servings.js) : les valeurs de
// référence sont déjà exprimées pour BASE_SERVINGS (4 personnes), donc la
// mise à l'échelle par portions est une simple règle de trois, sans avoir à
// convertir chaque unité (pièce, cuillère, bouquet...) en grammes.
// -----------------------------------------------------------------------------

import { BASE_SERVINGS } from '../data/ingredientQuantities.js'
import { CALORIES_PER_BASE } from '../data/ingredientCalories.js'

// Somme les calories des ingrédients reconnus pour le nombre de portions
// donné. Ignore silencieusement les ingrédients non reconnus (nom libre non
// présent dans la table) plutôt que de fausser l'estimation — reste donc
// volontairement approximatif, jamais un calcul nutritionnel exact.
export function estimateRecipeCalories(ingredientNames, servings) {
  let total = 0
  let recognizedCount = 0
  for (const name of ingredientNames) {
    const base = CALORIES_PER_BASE[name]
    if (base === undefined) continue
    recognizedCount += 1
    total += base * (servings / BASE_SERVINGS)
  }
  // En dessous de la moitié des ingrédients reconnus, l'estimation est trop
  // incomplète pour être honnête (recette essentiellement composée
  // d'ingrédients libres/non standards) — mieux vaut ne rien afficher.
  if (ingredientNames.length === 0 || recognizedCount < ingredientNames.length / 2) return null
  return Math.round(total / 10) * 10
}
