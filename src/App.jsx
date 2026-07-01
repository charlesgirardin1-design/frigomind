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
import { useApp } from './state/AppContext.jsx'

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
}

export default function App() {
  const { state, goTo } = useApp()
  const CurrentView = VIEWS[state.view] || HomePage

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CurrentView />
      </main>
      <footer className="text-center border-t border-neutral-100 py-6 mt-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={() => goTo('about')}
            className="text-sm font-medium text-neutral-600 hover:text-fresh-700 underline underline-offset-2 transition"
          >
            À propos
          </button>
          <button
            onClick={() => goTo('faq')}
            className="text-sm font-medium text-neutral-600 hover:text-fresh-700 underline underline-offset-2 transition"
          >
            FAQ
          </button>
          <button
            onClick={() => goTo('legal')}
            className="text-sm font-medium text-neutral-600 hover:text-fresh-700 underline underline-offset-2 transition"
          >
            Mentions légales
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          FrigoMind — MVP · analyse IA via Google Gemini (gratuit)
        </p>
      </footer>
    </div>
  )
}
