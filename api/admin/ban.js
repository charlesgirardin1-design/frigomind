// -----------------------------------------------------------------------------
// POST /api/admin/ban
// Body: { uid: string, disabled: boolean }
// Active/désactive un compte Firebase (un compte désactivé ne peut plus se
// connecter, mais ses données existantes ne sont pas supprimées).
// Réservé au compte admin (voir api/_lib/admin.js).
// -----------------------------------------------------------------------------

import { getAuth } from 'firebase-admin/auth'
import { requireAdmin } from '../_lib/admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

  const { uid, disabled } = req.body || {}
  if (!uid || typeof disabled !== 'boolean') {
    res.status(400).json({ error: 'uid et disabled (boolean) requis' })
    return
  }

  // Empêche l'admin de se bannir lui-même par erreur et de perdre l'accès.
  if (uid === decoded.uid) {
    res.status(400).json({ error: 'Impossible de modifier son propre compte' })
    return
  }

  try {
    await getAuth(app).updateUser(uid, { disabled })
    res.status(200).json({ ok: true, uid, disabled })
  } catch (err) {
    console.error('FrigoMind admin /ban:', err)
    res.status(500).json({ error: 'Impossible de modifier ce compte' })
  }
}
