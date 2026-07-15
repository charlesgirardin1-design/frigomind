// -----------------------------------------------------------------------------
// api/_lib/admin.js
// Initialisation Firebase Admin SDK (côté serveur uniquement — jamais importé
// depuis src/, qui n'utilise que le SDK client) + vérification qu'une requête
// vient bien du compte admin, pour les endpoints /api/admin/*.
//
// Variables d'environnement nécessaires (Vercel → Project Settings →
// Environment Variables, PAS de préfixe VITE_ puisque ce code ne tourne
// jamais dans le navigateur) :
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (coller la clé telle quelle, avec ses \n littéraux
//                           — voir la conversion ci-dessous)
// Ces trois valeurs viennent du JSON de compte de service téléchargé depuis
// Firebase Console → Paramètres du projet → Comptes de service → Générer une
// nouvelle clé privée.
//
// VITE_ADMIN_EMAIL (déjà utilisée côté client pour cacher la page /admin) est
// aussi lue ici pour vérifier l'identité de l'appelant — Vercel expose toutes
// les variables d'environnement configurées aux fonctions serverless, qu'elles
// aient le préfixe VITE_ ou non.
// -----------------------------------------------------------------------------

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function getAdminApp() {
  const apps = getApps()
  if (apps.length) return apps[0]

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY manquantes')
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

// Vérifie le header Authorization: Bearer <idToken> envoyé par AdminPage.jsx
// (voir user.getIdToken() côté client) et confirme que l'email du token
// correspond exactement à ADMIN_EMAIL. Renvoie le token décodé si valide,
// sinon lève une erreur avec un code HTTP à renvoyer tel quel.
export async function requireAdmin(req) {
  const adminEmail = (process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
  if (!adminEmail) {
    const err = new Error('VITE_ADMIN_EMAIL non configurée')
    err.statusCode = 503
    throw err
  }

  const authHeader = req.headers.authorization || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) {
    const err = new Error('Authorization header manquant')
    err.statusCode = 401
    throw err
  }

  let app
  try {
    app = getAdminApp()
  } catch (e) {
    const err = new Error(`Configuration Firebase Admin invalide : ${e.message}`)
    err.statusCode = 500
    throw err
  }

  let decoded
  try {
    decoded = await getAuth(app).verifyIdToken(idToken)
  } catch {
    const err = new Error('Token invalide')
    err.statusCode = 401
    throw err
  }

  const email = (decoded.email || '').trim().toLowerCase()
  if (email !== adminEmail) {
    // Message volontairement générique (404-like) plutôt que "403 Forbidden"
    // pour ne pas confirmer l'existence de ces endpoints à qui n'a pas accès.
    const err = new Error('Not found')
    err.statusCode = 404
    throw err
  }

  return { app, decoded }
}
