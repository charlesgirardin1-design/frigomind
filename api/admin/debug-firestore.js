// -----------------------------------------------------------------------------
// GET /api/admin/debug-firestore
// Diagnostique pourquoi la sauvegarde cloud (Firestore) ne contient rien :
// tente une écriture puis une lecture d'un document de test avec le SDK
// Admin (mêmes réglages par défaut que le SDK client utilisé par
// cloudSync.js — base de données "(default)"), et renvoie l'erreur brute le
// cas échéant plutôt qu'un message générique. Réservé au compte admin.
// -----------------------------------------------------------------------------

import { getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from '../_lib/admin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let app
  try {
    ;({ app } = await requireAdmin(req))
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message })
    return
  }

  const result = { projectId: app.options.credential?.projectId || null }

  try {
    // Voir firestore.js (client) : la base de ce projet s'appelle "frigomind",
    // pas "(default)".
    const db = getFirestore(app, 'frigomind')
    const testRef = db.collection('_diagnostic').doc('probe')

    await testRef.set({ checkedAt: new Date().toISOString() })
    result.writeOk = true

    const snap = await testRef.get()
    result.readOk = snap.exists
    result.readData = snap.data()

    await testRef.delete()

    const usersSnap = await db.collection('users').limit(10).get()
    result.usersCollectionSize = usersSnap.size
    result.usersCollectionSample = usersSnap.docs.map((d) => ({ id: d.id, keys: Object.keys(d.data()) }))

    res.status(200).json(result)
  } catch (err) {
    console.error('FrigoMind admin /debug-firestore:', err)
    res.status(200).json({
      ...result,
      writeOk: false,
      error: err.message,
      code: err.code || null,
    })
  }
}
