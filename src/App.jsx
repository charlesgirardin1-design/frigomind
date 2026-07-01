import Header from './components/Header.jsx'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ValidatePage from './pages/ValidatePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import LegalPage from './pages/LegalPage.jsx'
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
}

export default function App() {
  const { state, goTo } = useApp()
  const CurrentView = VIEWS[state.view] || HomePage

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CurrentView />
      </main>
      <footer className="text-center text-xs text-neutral-300 py-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <button onClick={() => goTo('about')} className="hover:text-neutral-500 transition">
            À propos
          </button>
          <span aria-hidden>·</span>
          <button onClick={() => goTo('faq')} className="hover:text-neutral-500 transition">
            FAQ
          </button>
          <span aria-hidden>·</span>
          <button onClick={() => goTo('legal')} className="hover:text-neutral-500 transition">
            Mentions légales
          </button>
        </div>
        FrigoMind — MVP · analyse IA via Google Gemini (gratuit)
      </footer>
    </div>
  )
}
