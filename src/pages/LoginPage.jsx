import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { LockGlyph } from '../components/Illustrations.jsx'

// Logo Google officiel (4 couleurs) en SVG inline — évite une dépendance
// d'icônes supplémentaire pour une seule icône multicolore.
function GoogleLogo(props) {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 26.9 36.4 24 36.4c-5.2 0-9.6-3.1-11.3-7.6l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.5l6.6 5.4C41.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  )
}

export default function LoginPage() {
  const { goTo } = useApp()
  const { isFirebaseConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      goTo('home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Merci de renseigner un email et un mot de passe.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, name.trim())
      } else {
        await signInWithEmail(email.trim(), password)
      }
      goTo('home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<LockGlyph className="w-full h-full" />}
        tone="neutral"
        title={mode === 'signup' ? 'Créer un compte' : 'Se connecter'}
        subtitle="Retrouvez votre historique et vos favoris sur tous vos appareils."
      />

      {!isFirebaseConfigured && (
        <div className="mt-6 rounded-xl border border-zest-200 bg-zest-50 text-zest-800 text-sm px-4 py-3">
          La connexion n'est pas encore configurée sur ce site (clés Firebase manquantes). Cette page est
          prête côté code — il ne reste qu'à renseigner les variables d'environnement Firebase pour
          l'activer.
        </div>
      )}

      <div className="mt-7 bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || !isFirebaseConfigured}
          className="w-full flex items-center justify-center gap-2.5 border border-neutral-200 rounded-xl py-2.5 font-medium text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleLogo />
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-neutral-100 flex-1" />
          <span className="text-xs text-neutral-400">ou avec votre email</span>
          <div className="h-px bg-neutral-100 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Votre prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
            />
          )}
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isFirebaseConfigured}
            className="w-full bg-fresh-600 hover:bg-fresh-700 text-white font-semibold rounded-xl py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Un instant…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-5">
          {mode === 'signup' ? (
            <>
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError('') }}
                className="text-fresh-700 font-medium underline underline-offset-2"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError('') }}
                className="text-fresh-700 font-medium underline underline-offset-2"
              >
                Créer un compte
              </button>
            </>
          )}
        </p>
      </div>

      <p className="text-xs text-neutral-400 text-center mt-6">
        En continuant, vous acceptez nos{' '}
        <button onClick={() => goTo('legal')} className="underline underline-offset-2 hover:text-neutral-600">
          mentions légales
        </button>.
      </p>
    </div>
  )
}
