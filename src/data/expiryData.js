// -----------------------------------------------------------------------------
// expiryData.js
// Petite base "anti-gaspi" : ingrédients considérés comme périssables rapidement.
// Sert à prioriser les recettes qui utilisent ces ingrédients avant qu'ils
// ne soient perdus (fonctionnalité bonus "mode anti-gaspi").
// -----------------------------------------------------------------------------

export const PERISHABLE_INGREDIENTS = [
  'lait',
  'yaourt',
  'fromage blanc',
  'crème fraîche',
  'viande hachée',
  'poisson',
  'épinards',
  'champignons',
  'jambon',
  'poulet',
  'salade',
  'herbes fraîches',
  'basilic',
  'coriandre',
  'saumon',
  'crevettes',
  'avocat',
  'fraises',
  'dinde',
  'feta',
  'boeuf',
  'porc',
  'saucisse',
]

// Ingrédients "de base" qu'on suppose toujours disponibles dans un placard
// (sel, poivre, huile...). On ne les demande jamais à l'utilisateur et on ne
// les compte pas comme "manquants" dans le matching de recettes.
export const PANTRY_STAPLES = [
  'sel',
  'poivre',
  'huile',
  "huile d'olive",
  'eau',
  'sucre',
  'farine',
  'vinaigre',
]

export function isPerishable(ingredientName) {
  const normalized = ingredientName.trim().toLowerCase()
  return PERISHABLE_INGREDIENTS.some((p) => normalized.includes(p))
}

export function isPantryStaple(ingredientName) {
  const normalized = ingredientName.trim().toLowerCase()
  return PANTRY_STAPLES.some((p) => normalized === p || normalized.includes(p))
}
