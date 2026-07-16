// -----------------------------------------------------------------------------
// suggestions.js
// Envoie une suggestion utilisateur dans Firestore (collection `suggestions`,
// distincte de `users/{uid}` utilisée pour la sauvegarde cloud — voir
// cloudSync.js). Import dynamique de firebase/firestore pour ne pas alourdir
// le bundle initial (même raison que cloudSync.js/firestore.js).
//
// Nécessite une règle Firestore autorisant la création sur `suggestions/*`
// pour les comptes connectés (voir SuggestionPage.jsx pour le formulaire).
// -----------------------------------------------------------------------------

const SUBMIT_TIMEOUT_MS = 10_000

export async function submitSuggestion({ text, category, uid, email, lang }) {
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
  const { db } = await import('../firestore.js')
  if (!db) throw new Error('Firestore non configuré')

  const write = addDoc(collection(db, 'suggestions'), {
    text: text.trim(),
    category,
    uid: uid || null,
    email: email || null,
    lang,
    createdAt: serverTimestamp(),
  })

  // Sans réseau (ou Firestore qui se croit hors-ligne), addDoc() peut rester
  // en attente indéfiniment au lieu d'échouer — le bouton "Envoyer" restait
  // bloqué sur "Envoi…" sans jamais afficher d'erreur. On force un échec
  // propre après un délai raisonnable plutôt que d'attendre indéfiniment.
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error('Délai dépassé — vérifiez votre connexion')
      err.code = 'timeout'
      reject(err)
    }, SUBMIT_TIMEOUT_MS)
  })

  await Promise.race([write, timeout])
}
