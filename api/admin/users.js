// -----------------------------------------------------------------------------
// GET /api/admin/users
// Liste les comptes Firebase (email, statut, dates) + le nombre total.
// Réservé au compte admin (voir api/_lib/admin.js).
// -----------------------------------------------------------------------------

import { getAuth } from 'firebase-admin/auth'
import { requireAdmin } from '../_lib/admin.js'

const MAX_PAGES = 10 // jusqu'à 10 000 comptes (1000/page) — largement assez pour ce site.

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

  try {
    const auth = getAuth(app)
    const users = []
    let pageToken
    let pages = 0

    do {
      const result = await auth.listUsers(1000, pageToken)
      for (const u of result.users) {
        users.push({
          uid: u.uid,
          email: u.email || null,
          disabled: u.disabled,
          creationTime: u.metadata.creationTime,
          lastSignInTime: u.metadata.lastSignInTime,
          provider: u.providerData[0]?.providerId || 'unknown',
        })
      }
      pageToken = result.pageToken
      pages += 1
    } while (pageToken && pages < MAX_PAGES)

    users.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime))

    res.status(200).json({ total: users.length, truncated: !!pageToken, users })
  } catch (err) {
    console.error('FrigoMind admin /users:', err)
    res.status(500).json({ error: 'Impossible de récupérer la liste des comptes' })
  }
}
