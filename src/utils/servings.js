// -----------------------------------------------------------------------------
// servings.js
// Recalcule la quantité affichée d'un ingrédient pour un nombre de personnes
// donné, à partir de la table de référence (base 4 personnes) dans
// ingredientQuantities.js. Approximatif par nature (voir le commentaire de ce
// fichier) : arrondi à des paliers "faciles à mesurer" plutôt qu'exact.
// -----------------------------------------------------------------------------

import { BASE_SERVINGS, INGREDIENT_QUANTITIES } from '../data/ingredientQuantities.js'

function roundNice(amount, unit) {
  if (unit === 'g' || unit === 'ml') {
    const step = amount >= 200 ? 10 : 5
    return Math.max(step, Math.round(amount / step) * step)
  }
  if (unit === 'pincée') {
    return Math.max(1, Math.round(amount))
  }
  // Unités comptées à la pièce/cuillère/bouquet : paliers de 0,5.
  return Math.max(0.5, Math.round(amount * 2) / 2)
}

function formatAmount(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}

// Au-delà de 1000, "1500 g"/"1500 ml" devient "1,5 kg"/"1,5 L" — plus court
// et plus lisible sur mobile, et plus proche de la façon dont on lit ou dit
// une quantité à voix haute (voir CookingMode.jsx) qu'un nombre à 4 chiffres.
const BIG_UNIT = { g: 'kg', ml: 'L' }

// Renvoie "200 g" / "1,5 kg" / "1,5 pièce(s)" / null si l'ingrédient n'est
// pas dans la table (nom non reconnu — reste silencieux plutôt que
// d'afficher un chiffre inventé).
export function scaleIngredientQuantity(name, servings) {
  const base = INGREDIENT_QUANTITIES[name]
  if (!base) return null
  const raw = base.amount * (servings / BASE_SERVINGS)
  const rounded = roundNice(raw, base.unit)

  const bigUnit = BIG_UNIT[base.unit]
  if (bigUnit && rounded >= 1000) {
    const big = Math.round(rounded / 100) / 10 // arrondi au dixième (précision à 100 g/100 ml)
    return `${formatAmount(big)} ${bigUnit}`
  }
  return `${formatAmount(rounded)} ${base.unit}`
}
