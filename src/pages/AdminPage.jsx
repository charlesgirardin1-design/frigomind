import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useTheme } from '../state/ThemeContext.jsx'
import { COMMON } from '../i18n/common.js'
import { useToast } from '../state/ToastContext.jsx'
import { isFirebaseConfigured } from '../firebase.js'
import { localizeRecipeName, RECIPES } from '../data/recipesDB.js'
import { DEFAULT_PREFERENCES, clearAvatar } from '../utils/storage.js'
import { extractCountryFlag } from '../utils/flag.js'
import PageHeader from '../components/PageHeader.jsx'
import { ShieldGlyph } from '../components/Illustrations.jsx'

const FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u
const COOKIE_CONSENT_KEY = 'frigomind:cookiesAccepted'
const MAX_RECIPE_RESULTS = 40

const ACCENTS_REGEX = /[̀-ͯ]/g
function normalize(str) {
  return str.trim().toLowerCase().normalize('NFD').replace(ACCENTS_REGEX, '')
}

// Pages/fonctionnalités en cours de construction, à surveiller depuis
// l'admin sans avoir à les rendre publiques pour vérifier leur état.
const WIP_FEATURES = [
  { view: 'recipesBrowse', labelKey: 'wipRecipesBrowse', status: 'inProgress' },
]

const STRINGS = {
  fr: {
    title: 'Administration',
    subtitle: 'Page technique cachée, réservée à votre compte — invisible dans le menu.',
    dashboardTitle: 'Tableau de bord',
    totalRecipes: 'Recettes en base',
    worldRecipes: 'Dont cuisine du monde',
    firebaseStatus: 'Authentification Firebase',
    swStatus: 'Service worker',
    buildMode: 'Mode de build',
    buildCommit: 'Dernier commit déployé',
    buildTime: 'Build généré le',
    configured: 'Configurée',
    notConfigured: 'Non configurée',
    active: 'Actif',
    inactive: 'Inactif',
    unavailable: 'Non disponible (build local)',
    cacheTitle: 'Cache & service worker',
    activeCaches: (n) => `${n} cache${n > 1 ? 's' : ''} actif${n > 1 ? 's' : ''}`,
    clearCache: 'Vider le cache et recharger',
    clearCacheConfirm: 'Vider tout le cache du site et recharger la page ?',
    dataTitle: 'Données locales (ce compte, cet appareil)',
    historyCount: (n) => `Historique — ${n} session${n > 1 ? 's' : ''}`,
    favoritesCount: (n) => `Favoris — ${n} recette${n > 1 ? 's' : ''}`,
    avatarPresent: 'Photo de profil locale : présente',
    avatarAbsent: 'Photo de profil locale : aucune',
    preferences: 'Préférences',
    resetAllTitle: 'Simuler un compte vierge',
    resetAllBody: 'Vide toutes les données locales (historique, favoris, préférences, photo, cache) et recharge la page, comme pour un tout nouvel utilisateur.',
    resetAllButton: 'Tout réinitialiser',
    resetAllConfirm: 'Vider toutes les données locales et recharger la page ? Cette action est irréversible.',
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
    recipesTitle: 'Explorateur de recettes',
    recipesSearchPlaceholder: 'Chercher par nom, ingrédient…',
    recipesResults: (shown, total) => `${shown} affichée${shown > 1 ? 's' : ''} sur ${total}`,
    wipTitle: 'Fonctionnalités en cours',
    wipRecipesBrowse: 'Toutes les recettes (catalogue de recherche)',
    wipStatusInProgress: 'En cours',
    view: 'Voir',
    usersTitle: 'Utilisateurs',
    usersLoading: 'Chargement des comptes…',
    usersError: 'Impossible de charger les comptes.',
    usersNotConfigured: 'Backend non configuré (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY manquantes côté serveur).',
    usersTotal: (n) => `${n} compte${n > 1 ? 's' : ''}`,
    usersRefresh: 'Rafraîchir',
    ban: 'Bannir',
    unban: 'Réactiver',
    banConfirm: (email) => `Bannir le compte ${email} ? Il ne pourra plus se connecter.`,
    unbanConfirm: (email) => `Réactiver le compte ${email} ?`,
    banDone: 'Compte banni.',
    unbanDone: 'Compte réactivé.',
    disabledBadge: 'Banni',
    self: 'vous',
    statNewWeek: 'Nouveaux (7 derniers jours)',
    statActiveWeek: 'Connectés (7 derniers jours)',
    statBanned: 'Comptes bannis',
    statProviders: 'Connexion via',
    providerGoogle: 'Google',
    providerApple: 'Apple',
    providerPassword: 'Email',
    providerOther: 'Autre',
    searchPlaceholder: 'Rechercher par email…',
    filterAll: 'Tous',
    filterActive: 'Actifs',
    filterBanned: 'Bannis',
    noUsersMatch: 'Aucun compte ne correspond.',
    activityTitle: 'Activité récente',
    activitySignup: 'Nouveau compte',
    activitySignin: 'Dernière connexion',
    activityEmpty: 'Aucune activité récente.',
    debugFirestoreTitle: 'Diagnostic sauvegarde cloud (Firestore)',
    debugFirestoreHint: "Teste une écriture/lecture réelle dans Firestore avec les mêmes réglages que l'app, et affiche l'erreur exacte le cas échéant.",
    debugFirestoreRun: 'Lancer le diagnostic',
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
    buildCommit: 'Last deployed commit',
    buildTime: 'Build generated at',
    configured: 'Configured',
    notConfigured: 'Not configured',
    active: 'Active',
    inactive: 'Inactive',
    unavailable: 'Unavailable (local build)',
    cacheTitle: 'Cache & service worker',
    activeCaches: (n) => `${n} active cache${n > 1 ? 's' : ''}`,
    clearCache: 'Clear cache and reload',
    clearCacheConfirm: 'Clear the whole site cache and reload the page?',
    dataTitle: 'Local data (this account, this device)',
    historyCount: (n) => `History — ${n} session${n > 1 ? 's' : ''}`,
    favoritesCount: (n) => `Favorites — ${n} recipe${n > 1 ? 's' : ''}`,
    avatarPresent: 'Local profile photo: present',
    avatarAbsent: 'Local profile photo: none',
    preferences: 'Preferences',
    resetAllTitle: 'Simulate a blank account',
    resetAllBody: 'Clears all local data (history, favorites, preferences, photo, cache) and reloads the page, like a brand new user.',
    resetAllButton: 'Reset everything',
    resetAllConfirm: 'Clear all local data and reload the page? This cannot be undone.',
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
    recipesTitle: 'Recipe explorer',
    recipesSearchPlaceholder: 'Search by name, ingredient…',
    recipesResults: (shown, total) => `${shown} shown out of ${total}`,
    wipTitle: 'Features in progress',
    wipRecipesBrowse: 'All recipes (search catalog)',
    wipStatusInProgress: 'In progress',
    view: 'View',
    usersTitle: 'Users',
    usersLoading: 'Loading accounts…',
    usersError: 'Could not load accounts.',
    usersNotConfigured: 'Backend not configured (missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY on the server).',
    usersTotal: (n) => `${n} account${n > 1 ? 's' : ''}`,
    usersRefresh: 'Refresh',
    ban: 'Ban',
    unban: 'Reactivate',
    banConfirm: (email) => `Ban account ${email}? They won't be able to sign in anymore.`,
    unbanConfirm: (email) => `Reactivate account ${email}?`,
    banDone: 'Account banned.',
    unbanDone: 'Account reactivated.',
    disabledBadge: 'Banned',
    self: 'you',
    statNewWeek: 'New (last 7 days)',
    statActiveWeek: 'Signed in (last 7 days)',
    statBanned: 'Banned accounts',
    statProviders: 'Signed in via',
    providerGoogle: 'Google',
    providerApple: 'Apple',
    providerPassword: 'Email',
    providerOther: 'Other',
    searchPlaceholder: 'Search by email…',
    filterAll: 'All',
    filterActive: 'Active',
    filterBanned: 'Banned',
    noUsersMatch: 'No account matches.',
    activityTitle: 'Recent activity',
    activitySignup: 'New account',
    activitySignin: 'Last sign-in',
    activityEmpty: 'No recent activity.',
    debugFirestoreTitle: 'Cloud sync diagnostic (Firestore)',
    debugFirestoreHint: 'Runs a real write/read against Firestore with the same settings as the app, and shows the exact error if any.',
    debugFirestoreRun: 'Run diagnostic',
  },
}

const WEEK_MS = 7 * 24 * 3600 * 1000
const ACTIVE_SIGNIN_GAP_MS = 60_000 // au-delà, on considère la connexion comme un événement distinct de l'inscription
const MAX_ACTIVITY_EVENTS = 15

const PROVIDER_LABEL_KEYS = {
  'google.com': 'providerGoogle',
  'apple.com': 'providerApple',
  password: 'providerPassword',
}

function providerLabel(provider, s) {
  return s[PROVIDER_LABEL_KEYS[provider]] || s.providerOther
}

// Statistiques dérivées uniquement des comptes déjà chargés (voir
// UsersSection) : aucun appel réseau supplémentaire.
function computeUserStats(users) {
  const now = Date.now()
  const stats = { newWeek: 0, activeWeek: 0, banned: 0, providers: {} }
  for (const u of users) {
    if (u.creationTime && now - new Date(u.creationTime).getTime() <= WEEK_MS) stats.newWeek += 1
    if (u.lastSignInTime && now - new Date(u.lastSignInTime).getTime() <= WEEK_MS) stats.activeWeek += 1
    if (u.disabled) stats.banned += 1
    const key = u.provider || 'other'
    stats.providers[key] = (stats.providers[key] || 0) + 1
  }
  return stats
}

// Journal d'activité synthétisé à partir des dates déjà connues par compte
// (pas de vrai stockage d'événements côté serveur) : une entrée "nouveau
// compte" par inscription, plus une entrée "dernière connexion" seulement si
// elle est nettement postérieure à l'inscription (sinon ce serait juste la
// même connexion comptée deux fois).
function buildActivityLog(users) {
  const events = []
  for (const u of users) {
    if (u.creationTime) events.push({ type: 'signup', date: u.creationTime, email: u.email || u.uid, key: `${u.uid}-signup` })
    if (
      u.lastSignInTime &&
      (!u.creationTime || new Date(u.lastSignInTime).getTime() - new Date(u.creationTime).getTime() > ACTIVE_SIGNIN_GAP_MS)
    ) {
      events.push({ type: 'signin', date: u.lastSignInTime, email: u.email || u.uid, key: `${u.uid}-signin` })
    }
  }
  return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, MAX_ACTIVITY_EVENTS)
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 break-all text-right">{value}</span>
        {action}
      </div>
    </div>
  )
}

// Onglet "Utilisateurs" : liste les comptes Firebase via /api/admin/users et
// permet de bannir/réactiver un compte via /api/admin/ban. Nécessite le
// backend Firebase Admin SDK (voir api/_lib/admin.js et .env.example) — si
// non configuré côté serveur, affiche un message clair plutôt que de planter.
function UsersSection({ s, user, lang }) {
  const [state, setState] = useState({ loading: true, error: null, total: 0, users: [] })
  const [pendingUid, setPendingUid] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'banned'
  const { showToast } = useToast()

  const stats = useMemo(() => computeUserStats(state.users), [state.users])
  const activityLog = useMemo(() => buildActivityLog(state.users), [state.users])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.users.filter((u) => {
      if (statusFilter === 'active' && u.disabled) return false
      if (statusFilter === 'banned' && !u.disabled) return false
      if (q && !(u.email || u.uid).toLowerCase().includes(q)) return false
      return true
    })
  }, [state.users, query, statusFilter])

  async function authedFetch(url, options = {}) {
    const idToken = await user.getIdToken()
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${idToken}`,
      },
    })
  }

  async function loadUsers() {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await authedFetch('/api/admin/users')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || String(res.status))
      setState({ loading: false, error: null, total: data.total, users: data.users })
    } catch (err) {
      setState({ loading: false, error: err.message || 'error', total: 0, users: [] })
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleBan(target) {
    const nextDisabled = !target.disabled
    const confirmMsg = nextDisabled ? s.banConfirm(target.email || target.uid) : s.unbanConfirm(target.email || target.uid)
    if (!window.confirm(confirmMsg)) return

    setPendingUid(target.uid)
    try {
      const res = await authedFetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: target.uid, disabled: nextDisabled }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.uid === target.uid ? { ...u, disabled: nextDisabled } : u)),
      }))
      showToast(nextDisabled ? s.banDone : s.unbanDone)
    } catch {
      showToast(s.usersError, { type: 'error' })
    } finally {
      setPendingUid(null)
    }
  }

  return (
    <div className="mt-6 card p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{s.usersTitle}</h3>
        <button onClick={loadUsers} className="text-xs text-neutral-400 hover:text-fresh-700 dark:hover:text-fresh-400 transition">
          {s.usersRefresh}
        </button>
      </div>

      {state.loading && <p className="text-sm text-neutral-400 mt-3">{s.usersLoading}</p>}

      {!state.loading && state.error && (
        <p className="text-sm text-zest-600 dark:text-zest-400 mt-3">
          {state.error === 'error' ? s.usersNotConfigured : state.error}
        </p>
      )}

      {!state.loading && !state.error && (
        <>
          <p className="text-xs text-neutral-400 mt-1 mb-3">{s.usersTotal(state.total)}</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-2.5 text-center">
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.newWeek}</div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">{s.statNewWeek}</div>
            </div>
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-2.5 text-center">
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.activeWeek}</div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">{s.statActiveWeek}</div>
            </div>
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-2.5 text-center">
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.banned}</div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">{s.statBanned}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mb-4 text-xs">
            <span className="text-neutral-400">{s.statProviders}</span>
            {Object.entries(stats.providers).map(([provider, count]) => (
              <span key={provider} className="badge badge-neutral">
                {providerLabel(provider, s)} · {count}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={s.searchPlaceholder}
              className="flex-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded-full px-3.5 py-1.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100 bg-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-full px-2.5 py-1.5 bg-transparent"
            >
              <option value="all">{s.filterAll}</option>
              <option value="active">{s.filterActive}</option>
              <option value="banned">{s.filterBanned}</option>
            </select>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredUsers.length === 0 && <p className="text-sm text-neutral-400 py-2">{s.noUsersMatch}</p>}
            {filteredUsers.map((u) => (
              <div
                key={u.uid}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                    {u.email || u.uid}
                    {u.uid === user.uid && <span className="text-neutral-400"> ({s.self})</span>}
                  </p>
                  {u.disabled && <span className="badge badge-zest mt-0.5 inline-block">{s.disabledBadge}</span>}
                </div>
                {u.uid !== user.uid && (
                  <button
                    onClick={() => toggleBan(u)}
                    disabled={pendingUid === u.uid}
                    className={`text-xs shrink-0 transition disabled:opacity-40 ${
                      u.disabled ? 'text-fresh-600 hover:text-fresh-700 dark:text-fresh-400' : 'text-neutral-400 hover:text-red-600'
                    }`}
                  >
                    {u.disabled ? s.unban : s.ban}
                  </button>
                )}
              </div>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mt-5 mb-2">{s.activityTitle}</h4>
          {activityLog.length === 0 ? (
            <p className="text-sm text-neutral-400">{s.activityEmpty}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {activityLog.map((event) => (
                <div key={event.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-neutral-700 dark:text-neutral-300 truncate">
                    <span className={event.type === 'signup' ? 'text-fresh-600 dark:text-fresh-400' : 'text-neutral-400'}>
                      {event.type === 'signup' ? s.activitySignup : s.activitySignin}
                    </span>{' '}
                    — {event.email}
                  </span>
                  <span className="text-neutral-400 shrink-0 tabular-nums">
                    {new Date(event.date).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Page cachée (route secrète /admin, voir App.jsx), réservée au compte dont
// l'email correspond à VITE_ADMIN_EMAIL (voir firebase.js/.env.example) :
// tableau de bord technique + gestion des données locales, sans lien depuis
// le menu ni la navigation.
// Petit outil de diagnostic : tente une écriture + lecture Firestore via le
// SDK Admin (mêmes réglages par défaut que le SDK client utilisé par
// cloudSync.js — base "(default)") et affiche le résultat brut. Sert à
// comprendre pourquoi la sauvegarde cloud peut sembler ne rien enregistrer
// (base "(default)" absente si un autre nom a été choisi à la création,
// écriture qui échoue silencieusement côté client, etc.) sans devoir
// naviguer dans la console Firebase.
function DebugFirestoreSection({ s, user }) {
  const [state, setState] = useState({ loading: false, result: null })

  async function runDiagnostic() {
    setState({ loading: true, result: null })
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/admin/debug-firestore', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json().catch(() => ({}))
      setState({ loading: false, result: { status: res.status, ...data } })
    } catch (err) {
      setState({ loading: false, result: { error: err.message } })
    }
  }

  return (
    <div className="mt-6 card p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{s.debugFirestoreTitle}</h3>
        <button
          onClick={runDiagnostic}
          disabled={state.loading}
          className="text-xs text-neutral-400 hover:text-fresh-700 dark:hover:text-fresh-400 transition disabled:opacity-50"
        >
          {state.loading ? s.usersLoading : s.debugFirestoreRun}
        </button>
      </div>
      <p className="text-xs text-neutral-400 mt-1">{s.debugFirestoreHint}</p>
      {state.result && (
        <pre className="mt-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(state.result, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { state, wipeHistory, clearFavorites, setPreferences, goTo } = useApp()
  const { user, localAvatar, setLocalAvatar } = useAuth()
  const lang = useLanguage()
  const { theme } = useTheme()
  const { showToast } = useToast()
  const s = STRINGS[lang]
  const [swActive, setSwActive] = useState(false)
  const [cacheCount, setCacheCount] = useState(0)
  const [cookieConsent, setCookieConsent] = useState(false)
  const [recipeQuery, setRecipeQuery] = useState('')

  useEffect(() => {
    setSwActive(!!navigator.serviceWorker?.controller)
    caches?.keys?.().then((keys) => setCacheCount(keys.length)).catch(() => setCacheCount(0))
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

  const recipeResults = useMemo(() => {
    const q = normalize(recipeQuery)
    if (!q) return []
    return RECIPES.filter((r) => {
      const haystack = normalize(
        [r.name, r.nameEn, ...(r.required || []), ...(r.optional || [])].join(' ')
      )
      return haystack.includes(q)
    }).slice(0, MAX_RECIPE_RESULTS)
  }, [recipeQuery])

  async function clearAllCachesAndReload() {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } finally {
      window.location.reload()
    }
  }

  function handleClearCache() {
    if (window.confirm(s.clearCacheConfirm)) clearAllCachesAndReload()
  }

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

  function handleResetAllLocalData() {
    if (!window.confirm(s.resetAllConfirm)) return
    wipeHistory()
    clearFavorites()
    setPreferences(DEFAULT_PREFERENCES)
    if (user) clearAvatar(user.uid)
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY)
    } catch {
      // Stockage indisponible : rien à faire de plus.
    }
    clearAllCachesAndReload()
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
          <Row label={s.buildMode} value={import.meta.env.MODE} />
          <Row label={s.buildCommit} value={typeof __BUILD_COMMIT__ !== 'undefined' && __BUILD_COMMIT__ ? __BUILD_COMMIT__ : s.unavailable} />
          <Row
            label={s.buildTime}
            value={typeof __BUILD_TIME__ !== 'undefined' ? new Date(__BUILD_TIME__).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—'}
          />
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.cacheTitle}</h3>
        <div className="mt-3">
          <Row
            label={s.swStatus}
            value={
              <span className={swActive ? 'text-fresh-600 dark:text-fresh-400' : 'text-neutral-400'}>
                {swActive ? s.active : s.inactive}
              </span>
            }
          />
          <Row label={s.activeCaches(cacheCount)} value="" />
        </div>
        <button onClick={handleClearCache} className="btn-secondary !py-2 !px-4 text-sm mt-3">
          {s.clearCache}
        </button>
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
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.resetAllTitle}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{s.resetAllBody}</p>
        <button onClick={handleResetAllLocalData} className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700 transition">
          {s.resetAllButton}
        </button>
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

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.recipesTitle}</h3>
        <input
          value={recipeQuery}
          onChange={(e) => setRecipeQuery(e.target.value)}
          placeholder={s.recipesSearchPlaceholder}
          className="w-full mt-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-2 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100 bg-transparent"
        />
        {recipeQuery.trim() && (
          <>
            <p className="text-xs text-neutral-400 mt-2">
              {s.recipesResults(recipeResults.length, RECIPES.length)}
            </p>
            <div className="max-h-72 overflow-y-auto mt-1">
              {recipeResults.map((r) => {
                const { flag, cleanName } = extractCountryFlag(localizeRecipeName(r, lang))
                return (
                <div key={r.id} className="py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 text-sm">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">
                    {r.emoji} {cleanName} {flag && <span aria-hidden>{flag}</span>}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {r.id} · {r.time} min · {r.level} · {r.cuisine} · {(r.required || []).length + (r.optional || []).length} ingrédients
                  </p>
                </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{s.wipTitle}</h3>
        <div className="mt-3">
          {WIP_FEATURES.map((f) => (
            <Row
              key={f.view}
              label={s[f.labelKey]}
              value={<span className="badge badge-zest">{s.wipStatusInProgress}</span>}
              action={
                <button onClick={() => goTo(f.view)} className="text-xs text-neutral-400 hover:text-fresh-700 dark:hover:text-fresh-400 transition">
                  {s.view}
                </button>
              }
            />
          ))}
        </div>
      </div>

      <UsersSection s={s} user={user} lang={lang} />
      <DebugFirestoreSection s={s} user={user} />
    </div>
  )
}
