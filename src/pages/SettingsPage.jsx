import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { GearGlyph } from '../components/Illustrations.jsx'

// Page "Paramètres" : gestion du compte connecté (nom affiché, mot de passe,
// déconnexion). Le changement de mot de passe n'est proposé que pour les
// comptes email/mot de passe — les comptes Google/Apple n'en ont pas.
export default function SettingsPage() {
  const { goTo } = useApp()
  const { user, logOut, changeDisplayName, changePassword } = useAuth()

  const hasPasswordProvider = !!user?.providerData?.some((p) => p.providerId === 'password')

  const [name, setName] = useState(user?.displayName || '')
  const [nameStatus, setNameStatus] = useState({ error: '', success: '', loading: false })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState({ error: '', success: '', loading: false })

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
        <h3 className="font-semibold text-neutral-900 mb-1">Compte</h3>
        <p className="text-sm text-neutral-500 mb-4">{user?.email}</p>

        <form onSubmit={handleNameSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">Nom affiché</label>
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
    </div>
  )
}
