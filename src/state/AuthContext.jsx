// -----------------------------------------------------------------------------
// AuthContext.jsx
// Authentification FrigoMind (Firebase Auth) : connexion Google (popup) et
// connexion/inscription par email + mot de passe. État séparé de AppContext
// pour ne pas mélanger navigation/données produit et session utilisateur.
// -----------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
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
    }
    return map[code] || "Une erreur est survenue. Réessayez."
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
        if (!isFirebaseConfigured) {
                setAuthLoading(false)
                return
        }
        const unsubscribe = onAuthStateChanged(auth, (u) => {
                setUser(u)
                setAuthLoading(false)
        })
        return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async () => {
        if (!isFirebaseConfigured) throw new Error('not-configured')
        try {
                const result = await signInWithPopup(auth, googleProvider)
                return result.user
        } catch (err) {
                throw new Error(friendlyError(err))
        }
  }, [])

  const signInWithApple = useCallback(async () => {
        if (!isFirebaseConfigured) throw new Error('not-configured')
        try {
                const result = await signInWithPopup(auth, appleProvider)
                return result.user
        } catch (err) {
                throw new Error(friendlyError(err))
        }
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
