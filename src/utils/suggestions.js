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

export async function submitSuggestion({ text, category, uid, email, lang }) {
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
  const { db } = await import('../firestore.js')
  if (!db) throw new Error('Firestore non configuré')

  await addDoc(collection(db, 'suggestions'), {
    text: text.trim(),
    category,
    uid: uid || null,
    email: email || null,
    lang,
    createdAt: serverTimestamp(),
  })
}
