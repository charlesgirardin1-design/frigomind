// -----------------------------------------------------------------------------
// GET /api/cron/send-reminders
// Tâche planifiée (voir "crons" dans vercel.json) qui envoie un rappel push
// "vous n'avez pas cuisiné depuis un moment" aux comptes qui l'ont activé
// (preferences.remindersEnabled) et ont un appareil enregistré (fcmToken,
// voir pushNotifications.js). Complète maybeShowReminder (reminders.js),
// qui ne peut afficher un rappel que si l'app est déjà ouverte.
//
// Protégé par CRON_SECRET (voir .env.example) : Vercel ajoute automatiquement
// "Authorization: Bearer <CRON_SECRET>" aux requêtes déclenchées par le
// planificateur quand cette variable est configurée — empêche quiconque
// d'appeler cette route publiquement pour spammer tous les comptes.
// -----------------------------------------------------------------------------

import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { getAdminApp } from '../_lib/admin.js'

const STALE_AFTER_DAYS = 2
const MESSAGES = {
  fr: { title: '🥕 Un petit creux ?', body: 'Ça fait un moment — jetez un œil à votre frigo, FrigoMind a peut-être une idée pour vous.' },
  en: { title: '🥕 Feeling hungry?', body: "It's been a while — take a peek in your fridge, FrigoMind might have an idea for you." },
}

function hoursSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / 3_600_000
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.authorization || ''
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
  }

  let app
  try {
    app = getAdminApp()
  } catch (err) {
    res.status(500).json({ error: `Configuration Firebase Admin invalide : ${err.message}` })
    return
  }

  try {
    // Voir src/firestore.js (client) : la base de ce projet s'appelle
    // "frigomind", pas "(default)".
    const db = getFirestore(app, 'frigomind')
    const messaging = getMessaging(app)

    const snapshot = await db.collection('users').get()
    let sent = 0
    let skipped = 0
    const errors = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const token = data.fcmToken
      const remindersEnabled = data.preferences?.remindersEnabled
      if (!token || !remindersEnabled) {
        skipped += 1
        continue
      }

      const lastSession = data.history?.[0]?.date
      const isStale = !lastSession || hoursSince(lastSession) >= STALE_AFTER_DAYS * 24
      if (!isStale) {
        skipped += 1
        continue
      }

      const messages = MESSAGES.fr
      try {
        await messaging.send({
          token,
          notification: { title: messages.title, body: messages.body },
        })
        sent += 1
      } catch (err) {
        errors.push({ uid: doc.id, error: err.message })
        // Jeton expiré/révoqué (désinstallation, permission retirée...) :
        // on le retire plutôt que de réessayer indéfiniment à chaque
        // exécution du cron.
        if (err.code === 'messaging/registration-token-not-registered') {
          await doc.ref.set({ fcmToken: null }, { merge: true })
        }
      }
    }

    res.status(200).json({ total: snapshot.size, sent, skipped, errors })
  } catch (err) {
    console.error('FrigoMind cron send-reminders:', err)
    res.status(500).json({ error: 'Échec de l\'envoi des rappels' })
  }
}
