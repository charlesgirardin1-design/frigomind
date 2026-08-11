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

// Caractère "de mot" (lettres accentuées incluses, ce fichier ne retire pas
// les accents) ou chiffre. Sert à ne faire correspondre un mot-clé qu'à de
// vraies limites de mot (voir containsPhrase ci-dessous).
const WORD_CHAR_REGEX = /[a-zàâäéèêëïîôöùûüÿçœæ0-9]/
function isWordChar(char) {
  return !!char && WORD_CHAR_REGEX.test(char)
}

function hasWordBoundaryAfter(text, index) {
  if (index >= text.length) return true
  const char = text[index]
  if (!isWordChar(char)) return true
  return (char === 's' || char === 'x') && index === text.length - 1
}

// Vrai si `phrase` apparaît dans `text` comme un mot entier, jamais comme
// simple fragment au milieu d'un autre mot. Un simple `.includes()` faisait
// par exemple compter "poireau", "veau" ou "agneau" comme des basiques de
// placard toujours disponibles, parce qu'ils contiennent la sous-chaîne
// "eau" — le moteur ne les demandait donc jamais et ne les comptait jamais
// comme manquants, même quand l'utilisateur n'en avait pas.
function containsPhrase(text, phrase) {
  let searchFrom = 0
  let index = text.indexOf(phrase, searchFrom)
  while (index !== -1) {
    const boundaryBefore = index === 0 || !isWordChar(text[index - 1])
    const boundaryAfter = hasWordBoundaryAfter(text, index + phrase.length)
    if (boundaryBefore && boundaryAfter) return true
    searchFrom = index + 1
    index = text.indexOf(phrase, searchFrom)
  }
  return false
}

export function isPerishable(ingredientName) {
  const normalized = ingredientName.trim().toLowerCase()
  return PERISHABLE_INGREDIENTS.some((p) => containsPhrase(normalized, p))
}

export function isPantryStaple(ingredientName) {
  const normalized = ingredientName.trim().toLowerCase()
  return PANTRY_STAPLES.some((p) => normalized === p || containsPhrase(normalized, p))
}
