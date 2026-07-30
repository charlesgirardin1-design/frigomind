// -----------------------------------------------------------------------------
// GET /api/admin/test-push
// Envoie une notification push de test au compte admin lui-même (via son
// propre jeton FCM, déjà enregistré s'il a activé les rappels dans
// Paramètres sur cet appareil) — vérifie toute la chaîne (VAPID côté
// client, service worker, identifiants Admin SDK côté serveur) sans
// attendre le cron quotidien ni la condition "2 jours sans session".
// Réservé au compte admin.
// -----------------------------------------------------------------------------

import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { requireAdmin } from '../_lib/admin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let app
  let decoded
  try {
    ;({ app, decoded } = await requireAdmin(req))
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message })
    return
  }

  try {
    const db = getFirestore(app, 'frigomind')
    const doc = await db.collection('users').doc(decoded.uid).get()
    const token = doc.data()?.fcmToken

    if (!token) {
      res.status(200).json({
        ok: false,
        error:
          "Aucun jeton push enregistré pour ce compte sur cet appareil. Va dans Paramètres, désactive puis réactive les rappels pour en générer un.",
      })
      return
    }

    await getMessaging(app).send({
      token,
      notification: {
        title: '🥕 Notification de test',
        body: 'Si tu vois ceci, les rappels push fonctionnent correctement !',
      },
    })

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('FrigoMind admin /test-push:', err)
    res.status(200).json({ ok: false, error: err.message, code: err.code || null })
  }
}
