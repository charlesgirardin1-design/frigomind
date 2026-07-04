import { useEffect } from 'react'
import Header from './components/Header.jsx'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ValidatePage from './pages/ValidatePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import LegalPage from './pages/LegalPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import BlogPage from './pages/BlogPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import ChangelogPage from './pages/ChangelogPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import PlanningPage from './pages/PlanningPage.jsx'
import IngredientPage from './pages/IngredientPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { useApp } from './state/AppContext.jsx'
import { useAuth } from './state/AuthContext.jsx'

// Pages accessibles sans être connecté : l'accueil, la connexion elle-même,
// les mentions légales (obligatoires même sans compte) et la page 404.
// Toutes les autres pages exigent une connexion Google / Apple / email.
const PUBLIC_VIEWS = new Set(['home', 'login', 'legal', 'notfound', 'about', 'faq'])

// Petit état d'attente affiché le temps de savoir si une session Firebase
// existe déjà, pour une page protégée — évite un flash de contenu protégé
// (ou un aller-retour vers la connexion) le temps que Firebase réponde.
function AuthGateLoading() {
  return <div className="flex items-center justify-center py-24 text-neutral-400 text-sm">Chargement…</div>
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
  planning: PlanningPage,
  ingredient: IngredientPage,
  login: LoginPage,
}

export default function App() {
  const { state, goTo, resetSession, requireLogin } = useApp()
  const { user, authLoading } = useAuth()

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

  const CurrentView = isProtectedView && (authLoading || !user) ? AuthGateLoading : VIEWS[state.view] || HomePage

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CurrentView />
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
              À propos
            </button>
            <button onClick={() => goTo('faq')} className="text-neutral-500 hover:text-fresh-700 transition">
              FAQ
            </button>
            <button onClick={() => goTo('blog')} className="text-neutral-500 hover:text-fresh-700 transition">
              Astuces anti-gaspi
            </button>
            <button onClick={() => goTo('ingredient')} className="text-neutral-500 hover:text-fresh-700 transition">
              Ingrédients
            </button>
            <button onClick={() => goTo('planning')} className="text-neutral-500 hover:text-fresh-700 transition">
              Planning de la semaine
            </button>
            <button onClick={() => goTo('stats')} className="text-neutral-500 hover:text-fresh-700 transition">
              Statistiques
            </button>
            <button onClick={() => goTo('changelog')} className="text-neutral-500 hover:text-fresh-700 transition">
              Nouveautés
            </button>
            <button onClick={() => goTo('legal')} className="text-neutral-500 hover:text-fresh-700 transition">
              Mentions légales
            </button>
            <button onClick={() => goToLegalSection('vos-informations-personnelles')} className="text-neutral-500 hover:text-fresh-700 transition">
              Vos informations personnelles
            </button>
            <button onClick={() => goToLegalSection('cookies')} className="text-neutral-500 hover:text-fresh-700 transition">
              Cookies
            </button>
            <button onClick={() => goTo('login')} className="text-neutral-500 hover:text-fresh-700 transition">
              Se connecter
            </button>
          </div>

          <p className="text-xs text-neutral-400 mt-6">
            FrigoMind — MVP · analyse IA via Google Gemini (gratuit)
          </p>
        </div>
      </footer>
    </div>
  )
}
