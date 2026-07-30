// -----------------------------------------------------------------------------
// messaging.js
// Initialise Firebase Cloud Messaging séparément de firebase.js (Auth), même
// raison que firestore.js : `firebase/messaging` est une dépendance qu'on ne
// veut charger que pour un visiteur qui active réellement les rappels push
// (voir pushNotifications.js, appelé uniquement depuis SettingsPage.jsx).
// -----------------------------------------------------------------------------

import { getMessaging, isSupported } from 'firebase/messaging'
import { firebaseApp } from './firebase.js'

// `isSupported()` renvoie false sans lever d'erreur sur les navigateurs sans
// Push API (Safari iOS notamment) — on s'appuie dessus plutôt que de laisser
// planter getMessaging() sur ces navigateurs.
export async function getMessagingInstance() {
  if (!firebaseApp) return null
  const supported = await isSupported().catch(() => false)
  if (!supported) return null
  return getMessaging(firebaseApp)
}
