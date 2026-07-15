// -----------------------------------------------------------------------------
// cloudSync.js
// Sauvegarde cloud (Firestore) de l'historique, des favoris et des
// préférences — en complément de la copie locale (localStorage, voir
// storage.js), pas à sa place : la copie locale reste utilisée pour un
// affichage instantané, le cloud sert à ne pas tout perdre si le cache du
// navigateur est vidé, et à retrouver ses données sur un autre appareil.
//
// Un seul document par compte : users/{uid}. Nécessite d'avoir activé
// Firestore dans la console Firebase (voir .env.example) — si ce n'est pas
// fait, `db` est utilisable mais les lectures/écritures échouent
// silencieusement (l'app continue de fonctionner en local uniquement).
// -----------------------------------------------------------------------------

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firestore.js'
import { getFavoriteKey } from './storage.js'

export function isCloudSyncAvailable() {
  return !!db
}

export async function fetchCloudData(uid) {
  if (!db || !uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.warn('FrigoMind: lecture cloud impossible', e)
    return null
  }
}

// Fire-and-forget : on ne bloque jamais l'UI sur une écriture cloud, et un
// échec (hors ligne, Firestore non activé, règles de sécurité...) reste
// silencieux — la copie locale fait déjà foi pour cette session.
export async function pushCloudData(uid, data) {
  if (!db || !uid) return
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true })
  } catch (e) {
    console.warn('FrigoMind: sauvegarde cloud impossible', e)
  }
}

// Fusionne l'historique local et cloud : dédoublonné par id, trié du plus
// récent au plus ancien. Le plafonnement (voir MAX_HISTORY) est appliqué
// ensuite par storage.saveHistoryEntries, pas ici.
export function mergeHistory(local, cloud) {
  const byId = new Map()
  for (const entry of [...(cloud || []), ...(local || [])]) {
    if (entry?.id) byId.set(entry.id, entry)
  }
  return [...byId.values()].sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Fusionne les favoris local et cloud : dédoublonné par clé recette (pas par
// favId, qui diffère si la même recette a été favorisée séparément sur deux
// appareils). En cas de doublon, on garde la version qui a une note/avis
// plutôt que de l'écraser silencieusement.
export function mergeFavorites(local, cloud) {
  const byKey = new Map()
  for (const entry of [...(cloud || []), ...(local || [])]) {
    if (!entry) continue
    const key = getFavoriteKey(entry)
    const existing = byKey.get(key)
    if (!existing || (!existing.rating && !existing.note && (entry.rating || entry.note))) {
      byKey.set(key, entry)
    }
  }
  return [...byKey.values()]
}
