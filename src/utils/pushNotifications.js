// -----------------------------------------------------------------------------
// pushNotifications.js
// Rappels anti-gaspi qui arrivent même app/onglet fermé, via Firebase Cloud
// Messaging — complète maybeShowReminder (reminders.js), qui ne peut
// afficher une notification que si l'app est déjà ouverte. Le jeton FCM
// obtenu ici est envoyé au même document Firestore users/{uid} que le reste
// du compte (voir cloudSync.js), lu ensuite par le cron serveur
// (api/cron/send-reminders.js) pour savoir à qui envoyer un rappel.
//
// Nécessite VITE_FIREBASE_VAPID_KEY (clé publique VAPID générée dans
// Firebase Console → Paramètres du projet → Cloud Messaging → Certificats
// Web Push — voir .env.example). Sans cette clé, ou sur un navigateur sans
// support (Safari iOS notamment), échoue silencieusement : les rappels
// locaux (app ouverte) continuent de fonctionner normalement.
// -----------------------------------------------------------------------------

// Enregistre ce navigateur pour recevoir des rappels push, et sauvegarde le
// jeton obtenu sur le compte. Doit être appelé après que la permission de
// notification a déjà été accordée (voir SettingsPage.jsx).
export async function enablePushNotifications(uid) {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!uid || !vapidKey || !('serviceWorker' in navigator)) return null

  try {
    const [{ getMessagingInstance }, { getToken }] = await Promise.all([
      import('../messaging.js'),
      import('firebase/messaging'),
    ])
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    if (!token) return null

    const { pushCloudData } = await import('./cloudSync.js')
    await pushCloudData(uid, { fcmToken: token })
    return token
  } catch (e) {
    console.warn('FrigoMind: activation des notifications push impossible', e)
    return null
  }
}

// Retire le jeton du compte (désactivation des rappels) — le navigateur
// garde sa permission de notification, seul l'envoi côté serveur s'arrête.
export async function disablePushNotifications(uid) {
  if (!uid) return
  try {
    const { pushCloudData } = await import('./cloudSync.js')
    await pushCloudData(uid, { fcmToken: null })
  } catch (e) {
    console.warn('FrigoMind: désactivation des notifications push impossible', e)
  }
}
