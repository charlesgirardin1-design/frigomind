// -----------------------------------------------------------------------------
// servings.js
// Recalcule la quantité affichée d'un ingrédient pour un nombre de personnes
// donné, à partir de la table de référence (base 4 personnes) dans
// ingredientQuantities.js. Approximatif par nature (voir le commentaire de ce
// fichier) : arrondi à des paliers "faciles à mesurer" plutôt qu'exact.
// -----------------------------------------------------------------------------

import { BASE_SERVINGS, INGREDIENT_QUANTITIES } from '../data/ingredientQuantities.js'
import { translateIngredientName } from '../data/ingredientTranslations.js'

const UNIT_TRANSLATIONS_EN = {
  bouquet: 'bunch',
  'boîte(s)': 'can(s)',
  'branche(s)': 'sprig(s)',
  'c. à café': 'tsp',
  'c. à soupe': 'tbsp',
  'feuille(s)': 'sheet(s)',
  'gousse / sachet': 'pod / packet',
  'gousse(s)': 'clove(s)',
  'morceau (3 cm)': 'piece (3 cm)',
  pincée: 'pinch',
  'pièce(s)': 'piece(s)',
  'tasse(s)': 'cup(s)',
  'tige(s)': 'stalk(s)',
  'tranche(s)': 'slice(s)',
}

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

function formatAmount(n, lang = 'fr') {
  if (Number.isInteger(n)) return String(n)
  return lang === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ',')
}

// Au-delà de 1000, "1500 g"/"1500 ml" devient "1,5 kg"/"1,5 L" — plus court
// et plus lisible sur mobile, et plus proche de la façon dont on lit ou dit
// une quantité à voix haute (voir CookingMode.jsx) qu'un nombre à 4 chiffres.
const BIG_UNIT = { g: 'kg', ml: 'L' }

// Renvoie "200 g" / "1,5 kg" / "1,5 pièce(s)" ("1.5 piece(s)" en anglais) /
// null si l'ingrédient n'est pas dans la table (nom non reconnu — reste
// silencieux plutôt que d'afficher un chiffre inventé).
export function scaleIngredientQuantity(name, servings, lang = 'fr') {
  const base = INGREDIENT_QUANTITIES[name]
  if (!base) return null
  const raw = base.amount * (servings / BASE_SERVINGS)
  const rounded = roundNice(raw, base.unit)

  const bigUnit = BIG_UNIT[base.unit]
  if (bigUnit && rounded >= 1000) {
    const big = Math.round(rounded / 100) / 10 // arrondi au dixième (précision à 100 g/100 ml)
    return `${formatAmount(big, lang)} ${bigUnit}`
  }
  const unit = lang === 'en' ? UNIT_TRANSLATIONS_EN[base.unit] || base.unit : base.unit
  return `${formatAmount(rounded, lang)} ${unit}`
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function leadingNumber(str) {
  const match = /^([\d.,]+)/.exec(str)
  return match ? match[1] : null
}

// Les étapes détaillées (voir scripts/detail-recipe-steps.mjs) contiennent
// des quantités écrites en dur dans le texte pour BASE_SERVINGS personnes
// ("Coupez les 600 g de pommes de terre..."), puisque ce sont des phrases
// figées et non des données structurées. Cette fonction retrouve, pour
// chaque ingrédient de la recette dont la quantité de base est un nombre
// entier (les fractions type "0,5 bouquet" ne sont pas fiables à repérer
// dans un texte rédigé par une IA, donc laissées telles quelles plutôt que
// mal réécrites), le nombre déjà présent dans la phrase et le remplace par
// la quantité recalculée pour `servings` — en ancrant la recherche sur le
// nom de l'ingrédient à proximité immédiate pour ne jamais toucher un autre
// nombre de la même phrase (temps de cuisson, température...).
export function scaleStepText(step, recipe, servings, lang = 'fr') {
  if (!recipe || servings === BASE_SERVINGS || !step) return step

  const ingredients = [...new Set([...(recipe.required || []), ...(recipe.optional || [])])]
  let result = step

  for (const ing of ingredients) {
    const base = INGREDIENT_QUANTITIES[ing]
    if (!base || !Number.isInteger(base.amount)) continue

    const scaled = scaleIngredientQuantity(ing, servings, lang)
    if (!scaled) continue

    const baseAmountStr = String(base.amount)
    // Le texte des étapes est déjà traduit en anglais (stepsEn) quand
    // lang==='en' — le nom d'ingrédient à repérer doit donc l'être aussi
    // (translateIngredientName), sans quoi la recherche du nom français
    // canonique ("fromage") ne trouverait jamais rien dans un texte qui dit
    // "cheese".
    const displayIngName = translateIngredientName(ing, lang)
    // Le nom de l'ingrédient doit apparaître dans les ~15 caractères qui
    // suivent le nombre (unité + connecteur "de"/"d'"/"of" éventuels) —
    // assez large pour "600 g de pommes de terre", assez court pour ne pas
    // déborder sur une autre phrase ou un autre nombre sans rapport. "s?"
    // sur CHAQUE mot (pas seulement le dernier) car le pluriel d'un nom
    // composé porte souvent sur le premier mot ("pomme de terre" ->
    // "pommes de terre", pas "pomme de terres").
    const ingPattern = displayIngName
      .split(' ')
      .map((word) => `${escapeRegex(word)}s?`)
      .join('\\s+')

    // Pas de `\b` autour de `ingPattern` : les caractères français comme
    // œ/é/è ne sont pas reconnus comme "mots" par `\b` en JS (basé sur
    // [A-Za-z0-9_] uniquement), ce qui ferait silencieusement échouer le
    // repérage pour des ingrédients comme "œufs".
    // Lookahead borné en LONGUEUR (pas en ponctuation) : des unités comme
    // "c. à café" contiennent un point, qui exclurait à tort la suite de la
    // phrase si on s'arrêtait au premier ".".
    if (base.unit === 'g' || base.unit === 'ml') {
      const regex = new RegExp(`\\b${baseAmountStr}\\s*${base.unit}\\b(?=.{0,15}${ingPattern})`, 'gi')
      result = result.replace(regex, scaled)
    } else {
      const newNumber = leadingNumber(scaled)
      if (!newNumber) continue
      const regex = new RegExp(`\\b${baseAmountStr}\\b(?=.{0,15}${ingPattern})`, 'gi')
      result = result.replace(regex, newNumber)
    }
  }

  return result
}
