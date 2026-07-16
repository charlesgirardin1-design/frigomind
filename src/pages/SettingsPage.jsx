import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'
import { GearGlyph } from '../components/Illustrations.jsx'
import { resizeImageFile } from '../utils/image.js'
import { isNotificationSupported } from '../utils/reminders.js'

const DELETE_CONFIRM_WORD = { fr: 'SUPPRIMER', en: 'DELETE' }

const STRINGS = {
  fr: {
    title: 'Paramètres',
    subtitle: 'Gérez les informations de votre compte FrigoMind.',
    profile: 'Profil',
    takePhoto: '📸 Prendre une photo',
    importPhoto: '🗂️ Importer',
    removePhoto: 'Retirer',
    photoLocal: 'Photo gardée uniquement sur cet appareil.',
    photoReadError: 'Impossible de lire cette image.',
    namePlaceholder: 'Votre prénom',
    oneMoment: 'Un instant…',
    save: 'Enregistrer',
    nameUpdated: 'Nom mis à jour.',
    emailVerified: '✓ Email vérifié',
    emailNotVerified: '⚠ Email non vérifié',
    sending: 'Envoi…',
    resendVerification: 'Renvoyer l’email de vérification',
    verificationResent: 'Email de vérification renvoyé.',
    passwordTitle: 'Mot de passe',
    passwordSubtitle: 'Changez le mot de passe de votre compte FrigoMind.',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    passwordTooShort: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
    passwordMismatch: 'Les deux mots de passe ne correspondent pas.',
    passwordChanged: 'Mot de passe modifié.',
    changePassword: 'Changer le mot de passe',
    preferencesTitle: 'Préférences par défaut',
    preferencesSubtitle: 'Réutilisées automatiquement à chaque nouvelle session pour générer vos recettes.',
    maxTime: 'Temps maximum',
    cuisineType: 'Type de cuisine',
    vegetarian: '🌱 Végétarien uniquement',
    timeOptions: [
      { value: '10', label: '10 min' },
      { value: '20', label: '20 min' },
      { value: '30', label: '30 min' },
      { value: 'peu importe', label: 'Peu importe' },
    ],
    cuisineOptions: [
      { value: 'toutes', label: 'Toutes' },
      { value: 'rapide', label: '⚡ Rapide' },
      { value: 'healthy', label: '🥗 Healthy' },
      { value: 'gourmand', label: '🧀 Gourmand' },
    ],
    remindersTitle: '🔔 Rappels anti-gaspi',
    remindersSubtitle:
      "Une notification vous invite à revenir si vous n'avez pas généré de recette depuis quelques jours. Fonctionne uniquement quand FrigoMind est ouvert dans votre navigateur (pas en arrière-plan, pas d'envoi à un serveur).",
    remindersToggle: 'Activer les rappels',
    remindersDenied:
      'Notifications bloquées par votre navigateur — autorisez-les dans les réglages du site pour activer les rappels.',
    dataTitle: 'Données locales',
    dataSubtitle: "Stockées uniquement sur cet appareil (rien n'est envoyé à un serveur).",
    historyCount: (n) => `Historique — ${n} session${n > 1 ? 's' : ''}`,
    favoritesCount: (n) => `Favoris — ${n} recette${n > 1 ? 's' : ''}`,
    clear: 'Effacer',
    historyCleared: 'Historique effacé.',
    favoritesCleared: 'Favoris effacés.',
    logoutTitle: 'Déconnexion',
    logoutSubtitle: 'Se déconnecter de FrigoMind sur cet appareil.',
    logout: 'Se déconnecter',
    dangerTitle: 'Zone dangereuse',
    dangerSubtitle:
      'Supprime définitivement votre compte FrigoMind ainsi que votre accès à votre historique et vos favoris liés à ce compte. Cette action est irréversible.',
    deleteConfirmPlaceholder: (word) => `Tapez "${word}" pour confirmer`,
    deleteConfirmError: (word) => `Tapez "${word}" pour confirmer.`,
    deleting: 'Suppression…',
    deleteAccount: 'Supprimer définitivement mon compte',
  },
  en: {
    title: 'Settings',
    subtitle: 'Manage your FrigoMind account information.',
    profile: 'Profile',
    takePhoto: '📸 Take a photo',
    importPhoto: '🗂️ Import',
    removePhoto: 'Remove',
    photoLocal: 'Photo kept only on this device.',
    photoReadError: 'Unable to read this image.',
    namePlaceholder: 'Your first name',
    oneMoment: 'One moment…',
    save: 'Save',
    nameUpdated: 'Name updated.',
    emailVerified: '✓ Email verified',
    emailNotVerified: '⚠ Email not verified',
    sending: 'Sending…',
    resendVerification: 'Resend verification email',
    verificationResent: 'Verification email resent.',
    passwordTitle: 'Password',
    passwordSubtitle: 'Change your FrigoMind account password.',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordTooShort: 'The new password must be at least 6 characters long.',
    passwordMismatch: 'The two passwords do not match.',
    passwordChanged: 'Password changed.',
    changePassword: 'Change password',
    preferencesTitle: 'Default preferences',
    preferencesSubtitle: 'Automatically reused every new session to generate your recipes.',
    maxTime: 'Maximum time',
    cuisineType: 'Cuisine type',
    vegetarian: '🌱 Vegetarian only',
    timeOptions: [
      { value: '10', label: '10 min' },
      { value: '20', label: '20 min' },
      { value: '30', label: '30 min' },
      { value: 'peu importe', label: 'No preference' },
    ],
    cuisineOptions: [
      { value: 'toutes', label: 'All' },
      { value: 'rapide', label: '⚡ Quick' },
      { value: 'healthy', label: '🥗 Healthy' },
      { value: 'gourmand', label: '🧀 Indulgent' },
    ],
    remindersTitle: '🔔 Zero-waste reminders',
    remindersSubtitle:
      "A notification invites you back if you haven't generated a recipe in a few days. Only works while FrigoMind is open in your browser (not in the background, nothing sent to a server).",
    remindersToggle: 'Enable reminders',
    remindersDenied: 'Notifications blocked by your browser — allow them in the site settings to enable reminders.',
    dataTitle: 'Local data',
    dataSubtitle: "Stored only on this device (nothing is sent to a server).",
    historyCount: (n) => `History — ${n} session${n > 1 ? 's' : ''}`,
    favoritesCount: (n) => `Favorites — ${n} recipe${n > 1 ? 's' : ''}`,
    clear: 'Clear',
    historyCleared: 'History cleared.',
    favoritesCleared: 'Favorites cleared.',
    logoutTitle: 'Sign out',
    logoutSubtitle: 'Sign out of FrigoMind on this device.',
    logout: 'Sign out',
    dangerTitle: 'Danger zone',
    dangerSubtitle:
      'Permanently deletes your FrigoMind account, along with your access to the history and favorites tied to this account. This action is irreversible.',
    deleteConfirmPlaceholder: (word) => `Type "${word}" to confirm`,
    deleteConfirmError: (word) => `Type "${word}" to confirm.`,
    deleting: 'Deleting…',
    deleteAccount: 'Permanently delete my account',
  },
}

// Page "Paramètres" : gestion du compte connecté (photo, nom, email, mot de
// passe, suppression), préférences de recettes par défaut, et données
// locales. Le changement/suppression avec mot de passe n'est proposé que
// pour les comptes email/mot de passe — les comptes Google/Apple n'en ont pas
// (ils se ré-authentifient via une popup à la place).
export default function SettingsPage() {
  const { state, goTo, setPreferences, wipeHistory, clearFavorites } = useApp()
  const { user, logOut, localAvatar, setLocalAvatar, changeDisplayName, changePassword, resendVerification, deleteAccount } =
    useAuth()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const confirmWord = DELETE_CONFIRM_WORD[lang]
  const { showToast } = useToast()

  const hasPasswordProvider = !!user?.providerData?.some((p) => p.providerId === 'password')

  const [name, setName] = useState(user?.displayName || '')
  const [nameStatus, setNameStatus] = useState({ error: '', success: '', loading: false })

  const [avatarStatus, setAvatarStatus] = useState({ error: '', loading: false })
  const [avatarError, setAvatarError] = useState(false)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState({ error: '', success: '', loading: false })

  const [verificationStatus, setVerificationStatus] = useState({ error: '', success: '', loading: false })

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteStatus, setDeleteStatus] = useState({ error: '', loading: false })

  const [remindersEnabled, setRemindersEnabled] = useState(() => !!state.preferences.remindersEnabled)
  const [remindersDenied, setRemindersDenied] = useState(false)

  // Préférence synchronisée dans le cloud comme le reste du compte (voir
  // preferences dans AppContext.jsx) : si elle change ailleurs (autre
  // appareil, fusion cloud au chargement), on répercute ici aussi.
  useEffect(() => {
    setRemindersEnabled(!!state.preferences.remindersEnabled)
  }, [state.preferences.remindersEnabled])

  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()
  const avatarUrl = localAvatar || user?.photoURL

  async function handleNameSubmit(e) {
    e.preventDefault()
    setNameStatus({ error: '', success: '', loading: true })
    try {
      await changeDisplayName(name.trim())
      setNameStatus({ error: '', success: s.nameUpdated, loading: false })
    } catch (err) {
      setNameStatus({ error: err.message, success: '', loading: false })
    }
  }

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarStatus({ error: '', loading: true })
    try {
      const dataUrl = await resizeImageFile(file, 320, 0.85)
      setLocalAvatar(dataUrl)
      setAvatarError(false)
      setAvatarStatus({ error: '', loading: false })
    } catch (err) {
      console.warn('FrigoMind: redimensionnement photo de profil impossible', err)
      setAvatarStatus({ error: s.photoReadError, loading: false })
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordStatus({ error: '', success: '', loading: false })
    if (newPassword.length < 6) {
      setPasswordStatus({ error: s.passwordTooShort, success: '', loading: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: s.passwordMismatch, success: '', loading: false })
      return
    }
    setPasswordStatus({ error: '', success: '', loading: true })
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus({ error: '', success: s.passwordChanged, loading: false })
    } catch (err) {
      setPasswordStatus({ error: err.message, success: '', loading: false })
    }
  }

  async function handleResendVerification() {
    setVerificationStatus({ error: '', success: '', loading: true })
    try {
      await resendVerification()
      setVerificationStatus({ error: '', success: s.verificationResent, loading: false })
    } catch (err) {
      setVerificationStatus({ error: err.message, success: '', loading: false })
    }
  }

  async function handleToggleReminders(e) {
    const wantEnabled = e.target.checked
    if (!wantEnabled) {
      setPreferences({ remindersEnabled: false })
      setRemindersEnabled(false)
      setRemindersDenied(false)
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setPreferences({ remindersEnabled: true })
      setRemindersEnabled(true)
      setRemindersDenied(false)
    } else {
      setRemindersEnabled(false)
      setRemindersDenied(true)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    if (deleteConfirmText.trim().toUpperCase() !== confirmWord) {
      setDeleteStatus({ error: s.deleteConfirmError(confirmWord), loading: false })
      return
    }
    setDeleteStatus({ error: '', loading: true })
    try {
      await deleteAccount(deletePassword)
      goTo('home')
    } catch (err) {
      setDeleteStatus({ error: err.message, loading: false })
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<GearGlyph className="w-full h-full" />}
        tone="neutral"
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-7 card p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">{s.profile}</h3>
        <p className="text-sm text-neutral-500 mb-4">{user?.email}</p>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-fresh-100 text-fresh-700 font-semibold flex items-center justify-center text-xl overflow-hidden shrink-0">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              initial
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={avatarStatus.loading}
              className="btn-secondary !py-2 !px-3.5 text-xs disabled:opacity-50"
            >
              {s.takePhoto}
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={avatarStatus.loading}
              className="btn-secondary !py-2 !px-3.5 text-xs disabled:opacity-50"
            >
              {s.importPhoto}
            </button>
            {localAvatar && (
              <button
                type="button"
                onClick={() => setLocalAvatar(null)}
                className="text-xs text-neutral-400 hover:text-red-600 px-1"
              >
                {s.removePhoto}
              </button>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>
        </div>
        {avatarStatus.error && <p className="text-sm text-red-600 mt-2">{avatarStatus.error}</p>}
        <p className="text-xs text-neutral-400 mt-2">{s.photoLocal}</p>

        <form onSubmit={handleNameSubmit} className="space-y-3 mt-4 pt-4 border-t border-neutral-100">
          <input
            type="text"
            placeholder={s.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
          />
          {nameStatus.error && <p className="text-sm text-red-600">{nameStatus.error}</p>}
          {nameStatus.success && <p className="text-sm text-fresh-700">{nameStatus.success}</p>}
          <button
            type="submit"
            disabled={nameStatus.loading || !name.trim()}
            className="btn-primary !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameStatus.loading ? s.oneMoment : s.save}
          </button>
        </form>

        {hasPasswordProvider && (
          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
            <span className={`badge ${user?.emailVerified ? 'badge-fresh' : 'badge-zest'}`}>
              {user?.emailVerified ? s.emailVerified : s.emailNotVerified}
            </span>
            {!user?.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={verificationStatus.loading}
                className="text-sm font-medium text-fresh-700 hover:text-fresh-800 disabled:opacity-50"
              >
                {verificationStatus.loading ? s.sending : s.resendVerification}
              </button>
            )}
          </div>
        )}
        {verificationStatus.success && <p className="text-sm text-fresh-700 mt-2">{verificationStatus.success}</p>}
        {verificationStatus.error && <p className="text-sm text-red-600 mt-2">{verificationStatus.error}</p>}
      </div>

      {hasPasswordProvider && (
        <div className="mt-6 card p-6">
          <h3 className="font-semibold text-neutral-900 mb-1">{s.passwordTitle}</h3>
          <p className="text-sm text-neutral-500 mb-4">{s.passwordSubtitle}</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              placeholder={s.currentPassword}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
            />
            <input
              type="password"
              placeholder={s.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
            />
            <input
              type="password"
              placeholder={s.confirmPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
            />

            {passwordStatus.error && <p className="text-sm text-red-600">{passwordStatus.error}</p>}
            {passwordStatus.success && <p className="text-sm text-fresh-700">{passwordStatus.success}</p>}

            <button
              type="submit"
              disabled={passwordStatus.loading || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordStatus.loading ? s.oneMoment : s.changePassword}
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">{s.preferencesTitle}</h3>
        <p className="text-sm text-neutral-500 mb-4">{s.preferencesSubtitle}</p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1.5">{s.maxTime}</p>
            <div className="flex flex-wrap gap-2">
              {s.timeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreferences({ maxTime: opt.value })}
                  className={`chip ${state.preferences.maxTime === opt.value ? 'chip-active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1.5">{s.cuisineType}</p>
            <div className="flex flex-wrap gap-2">
              {s.cuisineOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreferences({ cuisine: opt.value })}
                  className={`chip ${state.preferences.cuisine === opt.value ? 'chip-active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.preferences.vegetarien}
              onChange={(e) => setPreferences({ vegetarien: e.target.checked })}
              className="checkbox-fresh"
            />
            <span className="text-sm text-neutral-700">{s.vegetarian}</span>
          </label>
        </div>
      </div>

      {isNotificationSupported() && (
        <div className="mt-6 card p-6">
          <h3 className="font-semibold text-neutral-900 mb-1">{s.remindersTitle}</h3>
          <p className="text-sm text-neutral-500 mb-4">{s.remindersSubtitle}</p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={handleToggleReminders}
              className="checkbox-fresh"
            />
            <span className="text-sm text-neutral-700">{s.remindersToggle}</span>
          </label>
          {remindersDenied && <p className="text-xs text-zest-700 mt-2">{s.remindersDenied}</p>}
        </div>
      )}

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">{s.dataTitle}</h3>
        <p className="text-sm text-neutral-500 mb-4">{s.dataSubtitle}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-700">{s.historyCount(state.history.length)}</span>
            {state.history.length > 0 && (
              <button
                onClick={() => {
                  wipeHistory()
                  showToast(s.historyCleared)
                }}
                className="text-sm text-neutral-400 hover:text-red-600 shrink-0"
              >
                {s.clear}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-700">{s.favoritesCount(state.favorites.length)}</span>
            {state.favorites.length > 0 && (
              <button
                onClick={() => {
                  clearFavorites()
                  showToast(s.favoritesCleared)
                }}
                className="text-sm text-neutral-400 hover:text-red-600 shrink-0"
              >
                {s.clear}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900">{s.logoutTitle}</h3>
          <p className="text-sm text-neutral-500">{s.logoutSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => { logOut(); goTo('home') }}
          className="text-sm font-medium text-red-600 hover:text-red-700 shrink-0"
        >
          {s.logout}
        </button>
      </div>

      <div className="mt-6 card p-6 border-red-100">
        <h3 className="font-semibold text-red-700 mb-1">{s.dangerTitle}</h3>
        <p className="text-sm text-neutral-500 mb-4">{s.dangerSubtitle}</p>

        <form onSubmit={handleDeleteAccount} className="space-y-3">
          {hasPasswordProvider && (
            <input
              type="password"
              placeholder={s.currentPassword}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          )}
          <input
            type="text"
            placeholder={s.deleteConfirmPlaceholder(confirmWord)}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />

          {deleteStatus.error && <p className="text-sm text-red-600">{deleteStatus.error}</p>}

          <button
            type="submit"
            disabled={
              deleteStatus.loading ||
              (hasPasswordProvider && !deletePassword) ||
              deleteConfirmText.trim().toUpperCase() !== confirmWord
            }
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteStatus.loading ? s.deleting : s.deleteAccount}
          </button>
        </form>
      </div>
    </div>
  )
}
