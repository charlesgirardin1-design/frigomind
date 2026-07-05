import { useRef, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { GearGlyph } from '../components/Illustrations.jsx'
import { resizeImageFile } from '../utils/image.js'

const TIME_OPTIONS = [
  { value: '10', label: '10 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: 'peu importe', label: 'Peu importe' },
]

const CUISINE_OPTIONS = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'rapide', label: '⚡ Rapide' },
  { value: 'healthy', label: '🥗 Healthy' },
  { value: 'gourmand', label: '🧀 Gourmand' },
]

const DELETE_CONFIRM_WORD = 'SUPPRIMER'

// Page "Paramètres" : gestion du compte connecté (photo, nom, email, mot de
// passe, suppression), préférences de recettes par défaut, et données
// locales. Le changement/suppression avec mot de passe n'est proposé que
// pour les comptes email/mot de passe — les comptes Google/Apple n'en ont pas
// (ils se ré-authentifient via une popup à la place).
export default function SettingsPage() {
  const { state, goTo, setPreferences, wipeHistory, clearFavorites, clearPlanning } = useApp()
  const { user, logOut, localAvatar, setLocalAvatar, changeDisplayName, changePassword, resendVerification, deleteAccount } =
    useAuth()

  const hasPasswordProvider = !!user?.providerData?.some((p) => p.providerId === 'password')
  const planningCount = Object.values(state.planning).filter(Boolean).length

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

  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()
  const avatarUrl = localAvatar || user?.photoURL

  async function handleNameSubmit(e) {
    e.preventDefault()
    setNameStatus({ error: '', success: '', loading: true })
    try {
      await changeDisplayName(name.trim())
      setNameStatus({ error: '', success: 'Nom mis à jour.', loading: false })
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
      setAvatarStatus({ error: "Impossible de lire cette image.", loading: false })
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordStatus({ error: '', success: '', loading: false })
    if (newPassword.length < 6) {
      setPasswordStatus({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.', success: '', loading: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: 'Les deux mots de passe ne correspondent pas.', success: '', loading: false })
      return
    }
    setPasswordStatus({ error: '', success: '', loading: true })
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus({ error: '', success: 'Mot de passe modifié.', loading: false })
    } catch (err) {
      setPasswordStatus({ error: err.message, success: '', loading: false })
    }
  }

  async function handleResendVerification() {
    setVerificationStatus({ error: '', success: '', loading: true })
    try {
      await resendVerification()
      setVerificationStatus({ error: '', success: 'Email de vérification renvoyé.', loading: false })
    } catch (err) {
      setVerificationStatus({ error: err.message, success: '', loading: false })
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    if (deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRM_WORD) {
      setDeleteStatus({ error: `Tapez "${DELETE_CONFIRM_WORD}" pour confirmer.`, loading: false })
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
        backLabel="← Accueil"
        icon={<GearGlyph className="w-full h-full" />}
        tone="neutral"
        title="Paramètres"
        subtitle="Gérez les informations de votre compte FrigoMind."
      />

      <div className="mt-7 card p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Profil</h3>
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
              📸 Prendre une photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={avatarStatus.loading}
              className="btn-secondary !py-2 !px-3.5 text-xs disabled:opacity-50"
            >
              🗂️ Importer
            </button>
            {localAvatar && (
              <button
                type="button"
                onClick={() => setLocalAvatar(null)}
                className="text-xs text-neutral-400 hover:text-red-600 px-1"
              >
                Retirer
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
        <p className="text-xs text-neutral-400 mt-2">Photo gardée uniquement sur cet appareil.</p>

        <form onSubmit={handleNameSubmit} className="space-y-3 mt-4 pt-4 border-t border-neutral-100">
          <input
            type="text"
            placeholder="Votre prénom"
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
            {nameStatus.loading ? 'Un instant…' : 'Enregistrer'}
          </button>
        </form>

        {hasPasswordProvider && (
          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
            <span className={`badge ${user?.emailVerified ? 'badge-fresh' : 'badge-zest'}`}>
              {user?.emailVerified ? '✓ Email vérifié' : '⚠ Email non vérifié'}
            </span>
            {!user?.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={verificationStatus.loading}
                className="text-sm font-medium text-fresh-700 hover:text-fresh-800 disabled:opacity-50"
              >
                {verificationStatus.loading ? 'Envoi…' : 'Renvoyer l’email de vérification'}
              </button>
            )}
          </div>
        )}
        {verificationStatus.success && <p className="text-sm text-fresh-700 mt-2">{verificationStatus.success}</p>}
        {verificationStatus.error && <p className="text-sm text-red-600 mt-2">{verificationStatus.error}</p>}
      </div>

      {hasPasswordProvider && (
        <div className="mt-6 card p-6">
          <h3 className="font-semibold text-neutral-900 mb-1">Mot de passe</h3>
          <p className="text-sm text-neutral-500 mb-4">Changez le mot de passe de votre compte FrigoMind.</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
            />
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
            />
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
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
              {passwordStatus.loading ? 'Un instant…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Préférences par défaut</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Réutilisées automatiquement à chaque nouvelle session pour générer vos recettes.
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1.5">Temps maximum</p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((opt) => (
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
            <p className="text-xs font-medium text-neutral-500 mb-1.5">Type de cuisine</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((opt) => (
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
            <span className="text-sm text-neutral-700">🌱 Végétarien uniquement</span>
          </label>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Données locales</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Stockées uniquement sur cet appareil (rien n'est envoyé à un serveur).
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-700">
              Historique — {state.history.length} session{state.history.length > 1 ? 's' : ''}
            </span>
            {state.history.length > 0 && (
              <button onClick={wipeHistory} className="text-sm text-neutral-400 hover:text-red-600 shrink-0">
                Effacer
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-700">
              Favoris — {state.favorites.length} recette{state.favorites.length > 1 ? 's' : ''}
            </span>
            {state.favorites.length > 0 && (
              <button onClick={clearFavorites} className="text-sm text-neutral-400 hover:text-red-600 shrink-0">
                Effacer
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-700">
              Planning — {planningCount} jour{planningCount > 1 ? 's' : ''} rempli{planningCount > 1 ? 's' : ''}
            </span>
            {planningCount > 0 && (
              <button onClick={clearPlanning} className="text-sm text-neutral-400 hover:text-red-600 shrink-0">
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900">Déconnexion</h3>
          <p className="text-sm text-neutral-500">Se déconnecter de FrigoMind sur cet appareil.</p>
        </div>
        <button
          type="button"
          onClick={() => { logOut(); goTo('home') }}
          className="text-sm font-medium text-red-600 hover:text-red-700 shrink-0"
        >
          Se déconnecter
        </button>
      </div>

      <div className="mt-6 card p-6 border-red-100">
        <h3 className="font-semibold text-red-700 mb-1">Zone dangereuse</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Supprime définitivement votre compte FrigoMind ainsi que votre accès à votre historique, vos
          favoris et votre planning liés à ce compte. Cette action est irréversible.
        </p>

        <form onSubmit={handleDeleteAccount} className="space-y-3">
          {hasPasswordProvider && (
            <input
              type="password"
              placeholder="Mot de passe actuel"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          )}
          <input
            type="text"
            placeholder={`Tapez "${DELETE_CONFIRM_WORD}" pour confirmer`}
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
              deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRM_WORD
            }
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteStatus.loading ? 'Suppression…' : 'Supprimer définitivement mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
