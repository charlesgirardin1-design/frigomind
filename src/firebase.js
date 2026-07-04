// -----------------------------------------------------------------------------
// firebase.js
// Initialise Firebase (Auth uniquement) à partir de variables d'environnement
// Vite (VITE_FIREBASE_*). Voir .env.example à la racine du projet pour la
// liste des clés à renseigner (dans Vercel : Settings → Environment Variables).
// -----------------------------------------------------------------------------

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Vrai uniquement si toutes les clés indispensables sont renseignées.
// Permet d'afficher un message clair sur la page de connexion tant que
// Firebase n'est pas configuré, plutôt qu'un écran blanc / crash silencieux.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
)

export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const googleProvider = new GoogleAuthProvider()
