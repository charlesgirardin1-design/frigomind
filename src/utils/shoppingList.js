// -----------------------------------------------------------------------------
// shoppingList.js
// Petits helpers partagés par la modale de recette et la page planning pour
// construire et copier une liste de courses (ingrédients manquants).
// -----------------------------------------------------------------------------

/**
 * Dé-doublonne une liste de noms d'ingrédients (insensible à la casse/aux
 * espaces), en conservant la première graphie rencontrée.
 * @param {string[]} names
 * @returns {string[]}
 */
export function dedupeIngredientList(names) {
  const seen = new Set()
  const result = []
  for (const name of names) {
    const key = name.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(name.trim())
  }
  return result
}

/**
 * Copie un texte dans le presse-papiers. Ne bloque jamais l'utilisateur :
 * retourne simplement `false` si la copie échoue (navigateur trop ancien,
 * permission refusée...).
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {
    console.warn('FrigoMind: copie presse-papiers impossible', e)
  }
  return false
}
