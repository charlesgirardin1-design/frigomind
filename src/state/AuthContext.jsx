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
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  } from 'firebase/auth'
import { auth, googleProvider, appleProvider, isFirebaseConfigured } from '../firebase.js'
import { getAvatar, saveAvatar, clearAvatar } from '../utils/storage.js'
import { useLanguage } from './LanguageContext.jsx'

const AuthContext = createContext(null)

// Traduit les codes d'erreur Firebase les plus courants en message simple,
// dans la langue courante de l'interface.
const ERROR_MESSAGES = {
  fr: {
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-not-found': 'Aucun compte ne correspond à cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/popup-closed-by-user': 'Connexion annulée.',
    'auth/network-request-failed': 'Problème réseau, réessayez.',
    'auth/operation-not-allowed': "Cette méthode de connexion n'est pas encore activée.",
    'auth/account-exists-with-different-credential':
      'Un compte existe déjà avec cet email via un autre mode de connexion.',
    'auth/unauthorized-domain':
      "Ce site n'est pas encore autorisé pour cette connexion (configuration Firebase à finaliser).",
    'auth/requires-recent-login': 'Par sécurité, reconnectez-vous avant de changer votre mot de passe.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
    default: 'Une erreur est survenue. Réessayez.',
    notSignedIn: "Vous n'êtes pas connecté.",
  },
  en: {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'No account matches this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
    'auth/network-request-failed': 'Network issue, please try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email via a different sign-in method.',
    'auth/unauthorized-domain': 'This site is not yet authorized for this sign-in method (Firebase configuration pending).',
    'auth/requires-recent-login': 'For security, please sign in again before changing your password.',
    'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
    default: 'Something went wrong. Please try again.',
    notSignedIn: "You're not signed in.",
  },
}

function friendlyError(err, lang) {
  const code = err?.code || ''
  const messages = ERROR_MESSAGES[lang] || ERROR_MESSAGES.fr
  return messages[code] || messages.default
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

async function signInWithProvider(provider, lang) {
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
    throw new Error(friendlyError(err, lang))
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [localAvatar, setLocalAvatarState] = useState(null)
  const lang = useLanguage()

  // Photo de profil : gardée en local (voir storage.js — pas de Firebase
  // Storage configuré pour ce MVP), mais aussi poussée/récupérée via
  // Firestore (voir cloudSync.js, champ "avatar" du même document
  // users/{uid} que l'historique/favoris/préférences) pour rester cohérente
  // d'un appareil à l'autre. Le cloud fait foi dès qu'il contient une photo
  // (une photo choisie sur un appareil doit remplacer celle d'un autre) ; si
  // le cloud est encore vide mais qu'une photo locale existe déjà sur cet
  // appareil (typiquement une photo choisie avant l'ajout de cette
  // synchronisation), on la fait remonter pour qu'elle devienne la
  // référence commune au lieu de rester coincée sur ce seul appareil.
  useEffect(() => {
    if (!user) {
      setLocalAvatarState(null)
      return
    }
    const local = getAvatar(user.uid)
    setLocalAvatarState(local)
    let cancelled = false
    import('../utils/cloudSync.js').then(({ fetchCloudData, pushCloudData }) => {
      fetchCloudData(user.uid).then((cloud) => {
        if (cancelled) return
        if (cloud?.avatar) {
          if (cloud.avatar !== local) {
            saveAvatar(user.uid, cloud.avatar)
            setLocalAvatarState(cloud.avatar)
          }
        } else if (local) {
          pushCloudData(user.uid, { avatar: local })
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  const setLocalAvatar = useCallback(
    (dataUrl) => {
      if (!user) return
      if (dataUrl) {
        saveAvatar(user.uid, dataUrl)
      } else {
        clearAvatar(user.uid)
      }
      setLocalAvatarState(dataUrl)
      import('../utils/cloudSync.js').then(({ pushCloudData }) => pushCloudData(user.uid, { avatar: dataUrl || null }))
    },
    [user]
  )

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
      // Le profil (nom, photo) mis en cache par Firebase sur cet appareil
      // peut être périmé si on l'a changé depuis un autre appareil —
      // updateProfile() ne pousse pas la mise à jour en direct vers les
      // sessions déjà connectées ailleurs. On rafraîchit donc en arrière-plan
      // (sans bloquer l'affichage initial, voir setAuthLoading ci-dessus) et
      // on ne remet à jour l'état que si ça change réellement.
      if (u) {
        u.reload()
          .then(() => {
            if (auth.currentUser) setUser({ ...auth.currentUser })
          })
          .catch(() => {})
      }
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    return signInWithProvider(googleProvider, lang)
  }, [lang])

  const signInWithApple = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    return signInWithProvider(appleProvider, lang)
  }, [lang])

  const signInWithEmail = useCallback(async (email, password) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (err) {
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

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
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

  const logOut = useCallback(async () => {
    if (!isFirebaseConfigured) return
    await signOut(auth)
  }, [])

  // Envoie l'email standard Firebase "réinitialiser votre mot de passe"
  // (lien à cliquer). Utilisé depuis la page de connexion ("mot de passe
  // oublié ?") : ne révèle jamais si l'email existe ou non côté UI.
  const resetPassword = useCallback(async (email) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

  // Change le mot de passe depuis la page paramètres. Firebase exige une
  // connexion "récente" pour cette opération sensible : on se ré-authentifie
  // d'abord avec le mot de passe actuel plutôt que de laisser l'utilisateur
  // face à une erreur "requires-recent-login" incompréhensible.
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    if (!auth.currentUser) throw new Error(ERROR_MESSAGES[lang].notSignedIn)
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
    } catch (err) {
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

  // Renomme le compte (affiché dans le header et les emails Firebase).
  const changeDisplayName = useCallback(async (name) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    if (!auth.currentUser) throw new Error(ERROR_MESSAGES[lang].notSignedIn)
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      // updateProfile ne déclenche pas onAuthStateChanged : on force une mise
      // à jour locale pour que le nouveau nom apparaisse immédiatement.
      setUser({ ...auth.currentUser })
    } catch (err) {
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

  // Renvoie l'email de vérification (compte email/mot de passe non encore
  // confirmé). Le lien envoyé par Firebase est le même que celui de l'email
  // initial reçu à l'inscription.
  const resendVerification = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    if (!auth.currentUser) throw new Error(ERROR_MESSAGES[lang].notSignedIn)
    try {
      await sendEmailVerification(auth.currentUser)
    } catch (err) {
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

  // Supprime définitivement le compte Firebase. Comme pour le changement de
  // mot de passe, Firebase exige une connexion "récente" : on se
  // ré-authentifie d'abord (mot de passe pour un compte email, popup
  // Google/Apple sinon) plutôt que de laisser échouer avec une erreur
  // "requires-recent-login" incompréhensible.
  const deleteAccount = useCallback(async (currentPassword) => {
    if (!isFirebaseConfigured) throw new Error('not-configured')
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error(ERROR_MESSAGES[lang].notSignedIn)
    try {
      const hasPasswordProvider = currentUser.providerData.some((p) => p.providerId === 'password')
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
        await reauthenticateWithCredential(currentUser, credential)
      } else {
        const providerId = currentUser.providerData[0]?.providerId
        await reauthenticateWithPopup(currentUser, providerId === 'apple.com' ? appleProvider : googleProvider)
      }
      clearAvatar(currentUser.uid)
      await deleteUser(currentUser)
    } catch (err) {
      throw new Error(friendlyError(err, lang))
    }
  }, [lang])

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isFirebaseConfigured,
      localAvatar,
      setLocalAvatar,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      logOut,
      resetPassword,
      changePassword,
      changeDisplayName,
      resendVerification,
      deleteAccount,
    }),
    [
      user,
      authLoading,
      localAvatar,
      setLocalAvatar,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      logOut,
      resetPassword,
      changePassword,
      changeDisplayName,
      resendVerification,
      deleteAccount,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>")
  return ctx
}
