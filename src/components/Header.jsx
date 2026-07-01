import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'

const NAV_LINKS = [
  { view: 'home', label: 'Accueil' },
  { view: 'about', label: 'À propos' },
  { view: 'faq', label: 'FAQ' },
  { view: 'history', label: 'Historique' },
  { view: 'stats', label: 'Statistiques' },
]

// Menu de navigation principal du site : liens visibles en desktop,
// menu déroulant hamburger en mobile. Reste basé sur le routeur d'état
// existant (goTo / state.view), sans dépendance de routing externe.
export default function Header() {
  const { state, goTo, resetSession } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = (view) => {
    if (view === 'home') resetSession()
    goTo(view)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-100">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          className="flex items-center gap-2 font-extrabold text-lg text-neutral-900 shrink-0"
          onClick={() => navigate('home')}
        >
          <span aria-hidden>🥕</span>
          <span>Frigo<span className="text-fresh-600">Mind</span></span>
        </button>

        {/* Navigation desktop */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.view}
              onClick={() => navigate(link.view)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition ${
                state.view === link.view
                  ? 'bg-fresh-50 text-fresh-700'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Bouton hamburger mobile */}
        <button
          className="sm:hidden p-2 -mr-2 text-neutral-600 hover:text-neutral-900"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Panneau déroulant mobile */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-neutral-100 bg-white animate-fadeIn">
          <div className="max-w-3xl mx-auto px-4 py-2 flex flex-col">
            {NAV_LINKS.map((link) => (
              <button
                key={link.view}
                onClick={() => navigate(link.view)}
                className={`text-left text-sm font-medium px-2 py-2.5 rounded-lg transition ${
                  state.view === link.view
                    ? 'bg-fresh-50 text-fresh-700'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
