import Header from './components/Header.jsx'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ValidatePage from './pages/ValidatePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import { useApp } from './state/AppContext.jsx'

// Routeur ultra simple basé sur l'état global (pas de dépendance react-router,
// conformément à la contrainte "sans dépendances compliquées").
const VIEWS = {
  home: HomePage,
  upload: UploadPage,
  validate: ValidatePage,
  results: ResultsPage,
  history: HistoryPage,
}

export default function App() {
  const { state } = useApp()
  const CurrentView = VIEWS[state.view] || HomePage

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CurrentView />
      </main>
      <footer className="text-center text-xs text-neutral-300 py-6">
        FrigoMind — MVP · analyse IA gratuite dans le navigateur (TensorFlow.js)
      </footer>
    </div>
  )
}
