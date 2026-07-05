import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { LockGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    signinTitle: 'Se connecter',
    signupTitle: 'Créer un compte',
    resetTitle: 'Mot de passe oublié',
    signinSubtitle: 'Retrouvez votre historique et vos favoris sur tous vos appareils.',
    resetSubtitle: 'Indiquez votre email pour recevoir un lien de réinitialisation.',
    notConfigured:
      "La connexion n'est pas encore configurée sur ce site (clés Firebase manquantes). Cette page est prête côté code — il ne reste qu'à renseigner les variables d'environnement Firebase pour l'activer.",
    continueGoogle: 'Continuer avec Google',
    continueApple: 'Continuer avec Apple',
    orEmail: 'ou avec votre email',
    resetSentPrefix: 'Si un compte existe pour',
    resetSentSuffix: ', un email vient de vous être envoyé avec un lien pour choisir un nouveau mot de passe.',
    backToSignin: 'Retour à la connexion',
    backToSigninArrow: '← Retour à la connexion',
    emailPlaceholder: 'Adresse email',
    sendResetLink: 'Envoyer le lien de réinitialisation',
    namePlaceholder: 'Votre prénom',
    passwordPlaceholder: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    oneMoment: 'Un instant…',
    createAccount: 'Créer mon compte',
    alreadyAccount: 'Déjà un compte ?',
    noAccountYet: 'Pas encore de compte ?',
    signup: 'Créer un compte',
    fillEmailPassword: 'Merci de renseigner un email et un mot de passe.',
    fillEmail: 'Merci de renseigner votre adresse email.',
    legalPrefix: 'En continuant, vous acceptez nos',
    legalLink: 'mentions légales',
  },
  en: {
    signinTitle: 'Sign in',
    signupTitle: 'Create an account',
    resetTitle: 'Forgot password',
    signinSubtitle: 'Access your history and favorites on all your devices.',
    resetSubtitle: 'Enter your email to receive a reset link.',
    notConfigured:
      "Sign-in isn't configured on this site yet (missing Firebase keys). This page is ready in the code — Firebase environment variables just need to be set to enable it.",
    continueGoogle: 'Continue with Google',
    continueApple: 'Continue with Apple',
    orEmail: 'or with your email',
    resetSentPrefix: 'If an account exists for',
    resetSentSuffix: ', an email was just sent with a link to choose a new password.',
    backToSignin: 'Back to sign in',
    backToSigninArrow: '← Back to sign in',
    emailPlaceholder: 'Email address',
    sendResetLink: 'Send reset link',
    namePlaceholder: 'Your first name',
    passwordPlaceholder: 'Password',
    forgotPassword: 'Forgot password?',
    oneMoment: 'One moment…',
    createAccount: 'Create my account',
    alreadyAccount: 'Already have an account?',
    noAccountYet: "Don't have an account yet?",
    signup: 'Create an account',
    fillEmailPassword: 'Please enter an email and a password.',
    fillEmail: 'Please enter your email address.',
    legalPrefix: 'By continuing, you accept our',
    legalLink: 'legal notice',
  },
}

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

function AppleLogo(props) {
  return (
    <svg viewBox="0 0 384 512" width="18" height="18" fill="currentColor" {...props}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  )
}

export default function LoginPage() {
  const { state, goTo } = useApp()
  const { isFirebaseConfigured, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const afterLogin = () => goTo(state.redirectTo && state.redirectTo !== 'login' ? state.redirectTo : 'home')

  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      afterLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApple() {
    setError('')
    setLoading(true)
    try {
      await signInWithApple()
      afterLogin()
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
      setError(s.fillEmailPassword)
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, name.trim())
      } else {
        await signInWithEmail(email.trim(), password)
      }
      afterLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError(s.fillEmail)
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setResetSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setResetSent(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<LockGlyph className="w-full h-full" />}
        tone="neutral"
        title={mode === 'signup' ? s.signupTitle : mode === 'reset' ? s.resetTitle : s.signinTitle}
        subtitle={mode === 'reset' ? s.resetSubtitle : s.signinSubtitle}
      />

      {!isFirebaseConfigured && (
        <div className="mt-6 rounded-xl border border-zest-200 bg-zest-50 text-zest-800 text-sm px-4 py-3">
          {s.notConfigured}
        </div>
      )}

      <div className="mt-7 bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || !isFirebaseConfigured}
              className="w-full flex items-center justify-center gap-2.5 border border-neutral-200 rounded-xl py-2.5 font-medium text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleLogo />
              {s.continueGoogle}
            </button>

            <button
              type="button"
              onClick={handleApple}
              disabled={loading || !isFirebaseConfigured}
              className="w-full flex items-center justify-center gap-2.5 border border-neutral-200 rounded-xl py-2.5 mt-2.5 font-medium text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AppleLogo />
              {s.continueApple}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-neutral-100 flex-1" />
              <span className="text-xs text-neutral-400">{s.orEmail}</span>
              <div className="h-px bg-neutral-100 flex-1" />
            </div>
          </>
        )}

        {mode === 'reset' ? (
          resetSent ? (
            <div className="text-center py-2">
              <p className="text-sm text-neutral-600">
                {s.resetSentPrefix} <span className="font-medium">{email.trim()}</span>
                {s.resetSentSuffix}
              </p>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="mt-5 text-fresh-700 font-medium underline underline-offset-2 text-sm"
              >
                {s.backToSignin}
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-3">
              <input
                type="email"
                placeholder={s.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || !isFirebaseConfigured}
                className="w-full bg-fresh-600 hover:bg-fresh-700 text-white font-semibold rounded-xl py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? s.oneMoment : s.sendResetLink}
              </button>

              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 transition"
              >
                {s.backToSigninArrow}
              </button>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder={s.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
                />
              )}
              <input
                type="email"
                placeholder={s.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
              />
              <input
                type="password"
                placeholder={s.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fresh-200 focus:border-fresh-400"
              />

              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-neutral-500 hover:text-fresh-700 underline underline-offset-2 transition"
                  >
                    {s.forgotPassword}
                  </button>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || !isFirebaseConfigured}
                className="w-full bg-fresh-600 hover:bg-fresh-700 text-white font-semibold rounded-xl py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? s.oneMoment : mode === 'signup' ? s.createAccount : s.signinTitle}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-5">
              {mode === 'signup' ? (
                <>
                  {s.alreadyAccount}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-fresh-700 font-medium underline underline-offset-2"
                  >
                    {s.signinTitle}
                  </button>
                </>
              ) : (
                <>
                  {s.noAccountYet}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-fresh-700 font-medium underline underline-offset-2"
                  >
                    {s.signup}
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-neutral-400 text-center mt-6">
        {s.legalPrefix}{' '}
        <button onClick={() => goTo('legal')} className="underline underline-offset-2 hover:text-neutral-600">
          {s.legalLink}
        </button>
        .
      </p>
    </div>
  )
}
