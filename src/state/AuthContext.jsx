// -----------------------------------------------------------------------------
// AuthContext.jsx
// Authentification FrigoMind (Firebase Auth) : connexion Google / Apple
// (popup, avec repli automatique en redirection) et connexion/inscription
// par email + mot de passe. État séparé de AppContext pour ne pas mélanger
// navigation/données produit et session utilisateur.
// -----------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  } from 'firebase/auth'
import { auth, googleProvider, appleProvider, isFirebaseConfigured } from '../firebase.js'

const AuthContext = createContext(null)

// Traduit les codes d'erreur Firebase les plus courants en français simple.
function friendlyError(err) {
  const code = err?.code || ''
  const map = {
    'auth/invalid-email': "Adresse email invalide.",
    'auth/user-not-found': "Aucun compte ne correspond à cet email.",
    'auth/wrong-password': "Mot de passe incorrect.",
    'auth/invalid-credential': "Email ou mot de passe incorrect.",
    'auth/email-already-in-use': "Un compte existe déjà avec cet email.",
    'auth/weak-password': "Le mot de passe doit contenir au moins 6 caractères.",
    'auth/popup-closed-by-user': "Connexion annulée.",
    'auth/network-request-failed': "Problème réseau, réessayez.",
    'auth/operation-not-allowed': "Cette méthode de connexion n'est pas encore activée.",
    'auth/account-exists-with-different-credential': "Un compte existe déjà avec cet email via un autre mode de connexion.",
    'auth/unauthorized-domain': "Ce site n'est pas encore autorisé pour cette connexion (configuration Firebase à finaliser).",
  }
  return map[code] || "Une erreur est survenue. Réessayez."
}

// Certains navigateurs bloquent ou ne supportent pas l'ouverture d'une popup
// de connexion (bloqueur de popup, Safari iOS, navigateurs intégrés type
// Instagram/Messenger...). Dans ce cas, Firebase renvoie une erreur précise
// plutôt que d'afficher la fenêtre Google/Apple. On bascule alors
// automatiquement sur une connexion par redirection (l'appareil quitte la
// page puis y revient connecté) plutôt que de laisser l'utilisateur bloqué.
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
])

async function signInWithProvider(provider) {
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (err) {
    if (POPUP_FALLBACK_CODES.has(err?.code)) {
      // La page va se recharger : ce qui suit ne s'exécute jamais si la
      // redirection démarre correctement.
      await signInWithRedirect(auth, provider)
      return new Promise(() => {})
    }
    throw new Error(friendlyError(err))
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false)
      return
    }
    // Si on revient d'une redirection de connexion (repli popup bloquée),
    // on récupère le résultat ici. Les erreurs sont ignorées : le pire cas
    // est un utilisateur qui reste sur la page de connexion et peut réessayer.
    getRedirectResult(auth).catch(() => {})
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    return signInWithProvider(googleProvider)
  }, [])

  const signInWithApple = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    return signInWithProvider(appleProvider)
  }, [])

  const signInWithEmail = useCallback(async (email, password) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (err) {
      throw new Error(friendlyError(err))
    }
  }, [])

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }
      // Envoie l'email de confirmation d'inscription standard de Firebase
      // (lien de vérification à cliquer). N'empêche jamais la création du
      // compte si l'envoi échoue (ex: quota Firebase atteint).
      try {
        await sendEmailVerification(result.user)
      } catch (e) {
        console.warn('FrigoMind: email de confirmation non envoyé', e)
      }
      return result.user
    } catch (err) {
      throw new Error(friendlyError(err))
    }
  }, [])

  const logOut = useCallback(async () => {
    if (!isFirebaseConfigured) return
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isFirebaseConfigured,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      logOut,
    }),
    [user, authLoading, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, logOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>")
  return ctx
}
