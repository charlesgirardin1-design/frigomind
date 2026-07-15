import { useEffect, lazy, Suspense } from 'react'
import Header from './components/Header.jsx'
import HomePage from './pages/HomePage.jsx'
import CookieBanner from './components/CookieBanner.jsx'
import { useApp } from './state/AppContext.jsx'
import { useAuth } from './state/AuthContext.jsx'
import { useLanguage } from './state/LanguageContext.jsx'
import { COMMON } from './i18n/common.js'
import { applyPageMeta } from './i18n/pageTitles.js'

// La page d'accueil reste importée statiquement (c'est la première chose
// affichée, quasi toujours) ; toutes les autres pages sont chargées à la
// demande (React.lazy) pour garder le bundle initial léger — la base de
// recettes à elle seule (750 recettes) pèse une part importante du poids
// total, autant ne la charger que lorsqu'une page qui en a besoin s'affiche.
const UploadPage = lazy(() => import('./pages/UploadPage.jsx'))
const ValidatePage = lazy(() => import('./pages/ValidatePage.jsx'))
const ResultsPage = lazy(() => import('./pages/ResultsPage.jsx'))
const HistoryPage = lazy(() => import('./pages/HistoryPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'))
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const BlogPage = lazy(() => import('./pages/BlogPage.jsx'))
const StatsPage = lazy(() => import('./pages/StatsPage.jsx'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const IngredientPage = lazy(() => import('./pages/IngredientPage.jsx'))
const RecipesBrowsePage = lazy(() => import('./pages/RecipesBrowsePage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))

// Pages accessibles sans être connecté : l'accueil, la connexion elle-même,
// les mentions légales (obligatoires même sans compte), la page 404, ainsi
// que "à propos" et la FAQ (contenu informatif, sans données personnelles).
// Toutes les autres pages exigent une connexion Google / Apple / email.
const PUBLIC_VIEWS = new Set(['home', 'login', 'legal', 'notfound', 'about', 'faq', 'recipesBrowse'])

// Petit état d'attente affiché le temps de savoir si une session Firebase
// existe déjà, pour une page protégée — évite un flash de contenu protégé
// (ou un aller-retour vers la connexion) le temps que Firebase réponde.
function AuthGateLoading() {
  const lang = useLanguage()
  return <div className="flex items-center justify-center py-24 text-neutral-400 text-sm">{COMMON[lang].loading}</div>
}

// Routeur ultra simple basé sur l'état global (pas de dépendance react-router,
// conformément à la contrainte "sans dépendances compliquées").
const VIEWS = {
  home: HomePage,
  upload: UploadPage,
  validate: ValidatePage,
  results: ResultsPage,
  history: HistoryPage,
  about: AboutPage,
  faq: FaqPage,
  legal: LegalPage,
  notfound: NotFoundPage,
  blog: BlogPage,
  stats: StatsPage,
  changelog: ChangelogPage,
  favorites: FavoritesPage,
  ingredient: IngredientPage,
  recipesBrowse: RecipesBrowsePage,
  login: LoginPage,
  settings: SettingsPage,
}

export default function App() {
  const { state, goTo, resetSession, requireLogin } = useApp()
  const { user, authLoading } = useAuth()
  const lang = useLanguage()
  const c = COMMON[lang]

  // Navigue vers les mentions légales et scrolle jusqu'à la section demandée
  // (fonctionne qu'on soit déjà sur la page ou non, voir LegalPage.jsx).
  function goToLegalSection(id) {
    goTo('legal')
    // Le changement de hash déclenche un événement 'hashchange' que LegalPage
    // écoute pour scroller jusqu'à la bonne section et la surligner —
    // ça fonctionne qu'on soit déjà sur la page ou qu'on y arrive tout juste.
    window.location.hash = `#${id}`
  }
  const isProtectedView = !PUBLIC_VIEWS.has(state.view)

  // Met à jour l'onglet du navigateur (titre + meta description) à chaque
  // changement de vue ou de langue — la SPA n'a pas de routeur/URL distincte
  // par page, donc c'est le seul signal de contexte pour l'utilisateur (et
  // pour un éventuel partage/indexation).
  useEffect(() => {
    applyPageMeta(state.view, lang)
  }, [state.view, lang])

  // Au premier chargement, si l'URL visitée n'est pas la racine (lien direct
  // vers une adresse inconnue, faute de frappe, etc.), on affiche la page 404
  // au lieu de silencieusement retomber sur l'accueil.
  useEffect(() => {
    const path = window.location.pathname
    if (path && path !== '/' && path !== '/index.html') {
      goTo('notfound')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toutes les pages sauf l'accueil (+ connexion, mentions légales, 404)
  // exigent une connexion Google / Apple / email. On attend que Firebase ait
  // confirmé qu'il n'y a pas de session active (authLoading) avant de
  // rediriger, pour ne pas éjecter quelqu'un déjà connecté par erreur.
  useEffect(() => {
    if (authLoading) return
    if (isProtectedView && !user) {
      requireLogin(state.view)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.view, user, authLoading])

  // Repli pour le cas où la connexion est passée par une redirection
  // complète (popup bloquée, voir AuthContext.jsx) : la page vient de se
  // recharger, l'état React est reparti de zéro, mais sessionStorage a
  // gardé la page qu'on voulait vraiment atteindre.
  useEffect(() => {
    if (authLoading || !user) return
    try {
      const pending = sessionStorage.getItem('frigomind:pendingRedirect')
      if (pending) {
        sessionStorage.removeItem('frigomind:pendingRedirect')
        if (pending !== 'login') goTo(pending)
      }
    } catch {
      // Stockage indisponible : tant pis, l'utilisateur reste sur l'accueil.
    }
  }, [user, authLoading, goTo])

  const CurrentView = isProtectedView && (authLoading || !user) ? AuthGateLoading : VIEWS[state.view] || HomePage

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div key={state.view} className="animate-fadeIn">
          <Suspense fallback={<AuthGateLoading />}>
            <CurrentView />
          </Suspense>
        </div>
      </main>
      <footer className="border-t border-neutral-100 bg-white/60 mt-4">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <button
            onClick={() => { resetSession(); goTo('home') }}
            className="inline-flex items-center gap-2 font-extrabold text-neutral-900"
          >
            <img
              src="https://i.ibb.co/zW91Yz1J/d65636ed-a1f8-4b6d-9a6e-3137c924b593.png"
              alt="FrigoMind"
              className="w-6 h-6 rounded-md object-cover"
            />
            Frigo<span className="text-fresh-600">Mind</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-sm">
            <button onClick={() => goTo('about')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.about}
            </button>
            <button onClick={() => goTo('faq')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.faq}
            </button>
            <button onClick={() => goTo('blog')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.blog}
            </button>
            <button onClick={() => goTo('ingredient')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.ingredient}
            </button>
            <button onClick={() => goTo('stats')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.stats}
            </button>
            <button onClick={() => goTo('changelog')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.changelog}
            </button>
            <button onClick={() => goTo('legal')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.legal}
            </button>
            <button onClick={() => goToLegalSection('vos-informations-personnelles')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.personalData}
            </button>
            <button onClick={() => goToLegalSection('cookies')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.cookies}
            </button>
            <button onClick={() => goTo('login')} className="text-neutral-500 hover:text-fresh-700 transition">
              {c.nav.login}
            </button>
          </div>

          <p className="text-xs text-neutral-400 mt-6">
            {c.footerTagline}
          </p>
        </div>
      </footer>
      <CookieBanner />
    </div>
  )
}
