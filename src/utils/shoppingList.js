// -----------------------------------------------------------------------------
// shoppingList.js
// Petits helpers pour construire et copier une liste de courses (ingrédients
// manquants), utilisés par la modale de recette.
// -----------------------------------------------------------------------------

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
