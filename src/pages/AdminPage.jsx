import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useTheme } from '../state/ThemeContext.jsx'
import { COMMON } from '../i18n/common.js'
import { useToast } from '../state/ToastContext.jsx'
import { isFirebaseConfigured } from '../firebase.js'
import { RECIPES } from '../data/recipesDB.js'
import { DEFAULT_PREFERENCES, clearAvatar } from '../utils/storage.js'
import PageHeader from '../components/PageHeader.jsx'
import { ShieldGlyph } from '../components/Illustrations.jsx'

const FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u
const COOKIE_CONSENT_KEY = 'frigomind:cookiesAccepted'

const STRINGS = {
  fr: {
    title: 'Administration',
    subtitle: "Page technique cachée, réservée à votre compte — invisible dans le menu.",
    dashboardTitle: 'Tableau de bord',
    totalRecipes: 'Recettes en base',
    worldRecipes: 'Dont cuisine du monde',
    firebaseStatus: 'Authentification Firebase',
    swStatus: 'Service worker',
    buildMode: 'Mode de build',
    configured: 'Configurée',
    notConfigured: 'Non configurée',
    active: 'Actif',
    inactive: 'Inactif',
    dataTitle: 'Données locales (ce compte, cet appareil)',
    historyCount: (n) => `Historique — ${n} session${n > 1 ? 's' : ''}`,
    favoritesCount: (n) => `Favoris — ${n} recette${n > 1 ? 's' : ''}`,
    avatarPresent: 'Photo de profil locale : présente',
    avatarAbsent: 'Photo de profil locale : aucune',
    preferences: 'Préférences',
    globalTitle: 'Réglages globaux (cet appareil)',
    language: 'Langue',
    theme: 'Thème',
    cookieConsent: 'Consentement cookies',
    accepted: 'Accepté',
    notAnswered: 'Pas encore répondu',
    clear: 'Vider',
    reset: 'Réinitialiser',
    clearHistoryDone: 'Historique vidé.',
    clearFavoritesDone: 'Favoris vidés.',
    resetPrefsDone: 'Préférences réinitialisées.',
    clearAvatarDone: 'Photo de profil supprimée.',
    resetCookieDone: 'Consentement cookies réinitialisé — rechargez la page pour revoir le bandeau.',
  },
  en: {
    title: 'Admin',
    subtitle: 'Hidden technical page, restricted to your account — not linked from the menu.',
    dashboardTitle: 'Dashboard',
    totalRecipes: 'Recipes in database',
    worldRecipes: 'Of which world cuisine',
    firebaseStatus: 'Firebase authentication',
    swStatus: 'Service worker',
    buildMode: 'Build mode',
    configured: 'Configured',
    notConfigured: 'Not configured',
    active: 'Active',
    inactive: 'Inactive',
    dataTitle: 'Local data (this account, this device)',
    historyCount: (n) => `History — ${n} session${n > 1 ? 's' : ''}`,
    favoritesCount: (n) => `Favorites — ${n} recipe${n > 1 ? 's' : ''}`,
    avatarPresent: 'Local profile photo: present',
    avatarAbsent: 'Local profile photo: none',
    preferences: 'Preferences',
    globalTitle: 'Global settings (this device)',
    language: 'Language',
    theme: 'Theme',
    cookieConsent: 'Cookie consent',
    accepted: 'Accepted',
    notAnswered: 'Not answered yet',
    clear: 'Clear',
    reset: 'Reset',
    clearHistoryDone: 'History cleared.',
    clearFavoritesDone: 'Favorites cleared.',
    resetPrefsDone: 'Preferences reset.',
    clearAvatarDone: 'Profile photo removed.',
    resetCookieDone: 'Cookie consent reset — reload the page to see the banner again.',
  },
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value}</span>
        {action}
      </div>
    </div>
  )
}

// Page cachée (route secrète /admin, voir App.jsx), réservée au compte dont
// l'email correspond à VITE_ADMIN_EMAIL (voir firebase.js/.env.example) :
// tableau de bord technique + gestion des données locales, sans lien depuis
// le menu ni la navigation.
export default function AdminPage() {
  const { state, wipeHistory, clearFavorites, setPreferences, goTo } = useApp()
  const { user, localAvatar, setLocalAvatar } = useAuth()
  const lang = useLanguage()
  const { theme } = useTheme()
  const { showToast } = useToast()
  const s = STRINGS[lang]
  const [swActive, setSwActive] = useState(false)
  const [cookieConsent, setCookieConsent] = useState(false)

  useEffect(() => {
    setSwActive(!!navigator.serviceWorker?.controller)
    try {
      setCookieConsent(localStorage.getItem(COOKIE_CONSENT_KEY) === 'true')
    } catch {
      setCookieConsent(false)
    }
  }, [])

  const worldRecipeCount = useMemo(
    () => RECIPES.filter((r) => FLAG_REGEX.test(r.name) || FLAG_REGEX.test(r.nameEn || '')).length,
    []
  )

  function handleClearHistory() {
    wipeHistory()
    showToast(s.clearHistoryDone)
  }

  function handleClearFavorites() {
    clearFavorites()
    showToast(s.clearFavoritesDone)
  }

  function handleResetPreferences() {
    setPreferences(DEFAULT_PREFERENCES)
    showToast(s.resetPrefsDone)
  }

  function handleClearAvatar() {
    if (user) clearAvatar(user.uid)
    setLocalAvatar(null)
    showToast(s.clearAvatarDone)
  }

  function handleResetCookieConsent() {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY)
      setCookieConsent(false)
    } catch {
      // Stockage indisponible : rien à faire de plus.
    }
    showToast(s.resetCookieDone)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<ShieldGlyph className="w-full h-full" />}
        tone="neutral"
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.dashboardTitle}</h3>
        <div className="mt-3">
          <Row label={s.totalRecipes} value={RECIPES.length} />
          <Row label={s.worldRecipes} value={worldRecipeCount} />
          <Row
            label={s.firebaseStatus}
            value={
              <span className={isFirebaseConfigured ? 'text-fresh-600 dark:text-fresh-400' : 'text-zest-600 dark:text-zest-400'}>
                {isFirebaseConfigured ? s.configured : s.notConfigured}
              </span>
            }
          />
          <Row
            label={s.swStatus}
            value={
              <span className={swActive ? 'text-fresh-600 dark:text-fresh-400' : 'text-neutral-400'}>
                {swActive ? s.active : s.inactive}
              </span>
            }
          />
          <Row label={s.buildMode} value={import.meta.env.MODE} />
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.dataTitle}</h3>
        <div className="mt-3">
          <Row
            label={s.historyCount(state.history.length)}
            value=""
            action={
              state.history.length > 0 && (
                <button onClick={handleClearHistory} className="text-xs text-neutral-400 hover:text-red-600 transition">
                  {s.clear}
                </button>
              )
            }
          />
          <Row
            label={s.favoritesCount(state.favorites.length)}
            value=""
            action={
              state.favorites.length > 0 && (
                <button onClick={handleClearFavorites} className="text-xs text-neutral-400 hover:text-red-600 transition">
                  {s.clear}
                </button>
              )
            }
          />
          <Row
            label={s.preferences}
            value={`${state.preferences.maxTime} · ${state.preferences.cuisine} · ${state.preferences.vegetarien ? '🌱' : '—'}`}
            action={
              <button onClick={handleResetPreferences} className="text-xs text-neutral-400 hover:text-fresh-700 dark:hover:text-fresh-400 transition">
                {s.reset}
              </button>
            }
          />
          <Row
            label={localAvatar ? s.avatarPresent : s.avatarAbsent}
            value=""
            action={
              localAvatar && (
                <button onClick={handleClearAvatar} className="text-xs text-neutral-400 hover:text-red-600 transition">
                  {s.clear}
                </button>
              )
            }
          />
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.globalTitle}</h3>
        <div className="mt-3">
          <Row label={s.language} value={lang} />
          <Row label={s.theme} value={theme} />
          <Row
            label={s.cookieConsent}
            value={cookieConsent ? s.accepted : s.notAnswered}
            action={
              cookieConsent && (
                <button onClick={handleResetCookieConsent} className="text-xs text-neutral-400 hover:text-fresh-700 dark:hover:text-fresh-400 transition">
                  {s.reset}
                </button>
              )
            }
          />
        </div>
      </div>
    </div>
  )
}
